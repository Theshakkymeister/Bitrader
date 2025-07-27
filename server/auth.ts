import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    console.log("Comparing password for supplied:", supplied.length, "chars");
    console.log("Stored password format:", stored.substring(0, 20) + "...");
    
    const [hashed, salt] = stored.split(".");
    if (!hashed || !salt) {
      console.error("Invalid password hash format - no salt/hash separation");
      return false;
    }
    
    console.log("Hash length:", hashed.length, "Salt length:", salt.length);
    
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    const result = timingSafeEqual(hashedBuf, suppliedBuf);
    
    console.log("Password comparison result:", result);
    return result;
  } catch (error) {
    console.error("Password comparison error:", error);
    return false;
  }
}

export function setupAuth(app: Express) {
  // Production-ready session configuration
  const isProduction = process.env.NODE_ENV === "production";
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "bitrader-secret-key-production-2025",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    store: storage.sessionStore,
    cookie: {
      secure: isProduction, // HTTPS only in production
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: isProduction ? "strict" : "lax" as const,
    },
    name: "bitrader.session",
  };

  console.log("AUTH SETUP: Environment is", process.env.NODE_ENV || "development");
  console.log("AUTH SETUP: Secure cookies", isProduction);

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log("Attempting login for username/email:", username);
        
        // Try to find user by username first, then by email
        let user = await storage.getUserByUsername(username);
        if (!user) {
          user = await storage.getUserByEmail(username);
        }
        
        if (!user) {
          console.log("User not found for:", username);
          return done(null, false, { message: 'User not found' });
        }
        
        console.log("User found:", user.username, "checking password...");
        
        const passwordMatch = await comparePasswords(password, user.password);
        console.log("Password match result:", passwordMatch);
        
        if (!passwordMatch) {
          console.log("Password mismatch for user:", username);
          return done(null, false, { message: 'Invalid password' });
        }
        
        console.log("Login successful for user:", user.username);
        
        // Check if this user is also an admin
        try {
          const adminUser = await storage.getAdminByEmail(user.email.toLowerCase());
          if (adminUser && adminUser.isActive) {
            console.log("User is also an admin:", user.email);
            // We'll set admin session in the login route
            (user as any).isAdmin = true;
            (user as any).adminData = adminUser;
          }
        } catch (error) {
          console.log("Admin check error (non-critical):", error);
        }
        
        return done(null, user);
      } catch (error) {
        console.error("Login error:", error);
        return done(error);
      }
    })
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ message: "Username, email, and password are required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(email.toLowerCase());
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Create new user
      const user = await storage.createUser({
        username,
        email: email.toLowerCase(),
        password: await hashPassword(password),
        firstName: username, // Use username as firstName for now
        lastName: "",
      });

      // Auto-login after registration
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/login", (req, res, next) => {
    console.log("Login attempt with body:", req.body);
    
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error("Passport authentication error:", err);
        return res.status(500).json({ message: "Authentication error" });
      }
      
      if (!user) {
        console.log("Authentication failed, no user returned");
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      req.logIn(user, (err) => {
        if (err) {
          console.error("Login error:", err);
          return res.status(500).json({ message: "Login failed" });
        }
        
        // If user is also an admin, set admin session
        if ((user as any).isAdmin && (user as any).adminData) {
          req.session.adminUser = (user as any).adminData;
          console.log("Admin session also set for:", user.email);
        }
        
        console.log("User logged in successfully:", user.email);
        res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    // Clear admin session if it exists
    if (req.session.adminUser) {
      req.session.adminUser = null;
      console.log("Admin session cleared");
    }
    
    req.logout((err) => {
      if (err) return next(err);
      console.log("User logged out successfully");
      res.sendStatus(200);
    });
  });

  app.get("/api/user", async (req, res) => {
    console.log("GET /api/user - Session ID:", req.sessionID);
    console.log("GET /api/user - Is authenticated:", req.isAuthenticated());
    console.log("GET /api/user - User:", req.user ? req.user.username : "none");
    console.log("GET /api/user - Session data:", req.session);
    
    if (!req.isAuthenticated()) {
      console.log("User not authenticated, returning 401");
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Add admin status to user data
    const userData = { ...req.user };
    try {
      const adminUser = await storage.getAdminByEmail(req.user.email.toLowerCase());
      if (adminUser && adminUser.isActive) {
        (userData as any).isAdmin = true;
      }
    } catch (error) {
      console.log("Admin check error (non-critical):", error);
    }
    
    console.log("Returning user data:", req.user?.username);
    res.json(userData);
  });
}