import bcrypt from 'bcrypt';
import type { RequestHandler } from "express";
import { storage } from "./storage";

declare global {
  namespace Express {
    interface Request {
      adminUser?: any;
    }
    interface Session {
      adminUser?: any;
    }
  }
}

// Admin authentication middleware
export const isAdminAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.session?.adminUser) {
    return res.status(401).json({ message: "Admin authentication required" });
  }

  try {
    // Verify admin user still exists and is active
    const admin = await storage.getAdminByEmail(req.session.adminUser.email);
    if (!admin || !admin.isActive) {
      req.session.adminUser = null;
      return res.status(401).json({ message: "Admin access revoked" });
    }

    req.adminUser = admin;
    return next();
  } catch (error) {
    console.error("Admin auth middleware error:", error);
    return res.status(500).json({ message: "Authentication error" });
  }
};

// Hash password for admin user
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Verify password for admin user
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

// Initialize admin user if not exists
export const initializeAdminUser = async () => {
  try {
    const existingAdmin = await storage.getAdminByEmail("Ken.attwood@yahoo.com");
    
    if (!existingAdmin) {
      // Create default admin user with temporary password
      const defaultPassword = "AdminPass2025!"; // User should change this immediately
      const passwordHash = await hashPassword(defaultPassword);
      
      await storage.createAdmin({
        email: "Ken.attwood@yahoo.com",
        passwordHash,
        firstName: "Ken",
        lastName: "Attwood",
        role: "super_admin",
        isActive: true,
      });

      console.log("✅ Admin user created: Ken.attwood@yahoo.com");
      console.log("🔐 Default password: AdminPass2025!");
      console.log("⚠️  Please change the password immediately after first login");
    }
  } catch (error) {
    console.error("Failed to initialize admin user:", error);
  }
};

// Log admin activity
export const logAdminActivity = async (
  adminId: string,
  action: string,
  resource: string,
  resourceId?: string,
  details?: any,
  req?: any
) => {
  try {
    await storage.createAdminLog({
      adminId,
      action,
      resource,
      resourceId,
      details,
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.get('User-Agent'),
    });
  } catch (error) {
    console.error("Failed to log admin activity:", error);
  }
};