import bcrypt from 'bcrypt';
import type { RequestHandler } from "express";
import { storage } from "./storage";

declare global {
  namespace Express {
    interface Request {
      adminUser?: any;
    }
  }
}

declare module 'express-session' {
  interface SessionData {
    adminUser?: any;
  }
}

// Admin authentication middleware - PRODUCTION READY
export const isAdminAuthenticated: RequestHandler = async (req, res, next) => {
  // Check if session exists and has admin user
  if (!req.session?.adminUser) {
    console.log("ADMIN AUTH: No session found");
    return res.status(401).json({ message: "Admin authentication required" });
  }

  try {
    // Verify admin user still exists and is active in database
    const admin = await storage.getAdminByEmail(req.session.adminUser.email);
    if (!admin || !admin.isActive) {
      console.log("ADMIN AUTH: Admin not found or inactive:", req.session.adminUser.email);
      req.session.adminUser = null;
      return res.status(401).json({ message: "Admin access revoked" });
    }

    // Set admin user for route handlers
    req.adminUser = admin;
    console.log("ADMIN AUTH: Access granted to:", admin.email);
    return next();
  } catch (error) {
    console.error("ADMIN AUTH ERROR:", error);
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

// Initialize admin user if not exists - PRODUCTION READY
export const initializeAdminUser = async () => {
  try {
    const adminEmail = "ken.attwood@yahoo.com"; // Use lowercase for consistency
    const existingAdmin = await storage.getAdminByEmail(adminEmail);
    
    if (!existingAdmin) {
      // Create default admin user - PRODUCTION DEPLOYMENT
      const defaultPassword = "AdminPass2025!";
      const passwordHash = await hashPassword(defaultPassword);
      
      await storage.createAdmin({
        email: adminEmail,
        passwordHash,
        firstName: "Ken",
        lastName: "Attwood",
        role: "super_admin",
        isActive: true,
      });

      console.log("✅ PRODUCTION: Admin user created:", adminEmail);
      console.log("🔐 Default password: AdminPass2025!");
      console.log("⚠️  Change password after deployment");
    } else {
      console.log("✅ PRODUCTION: Admin user verified:", adminEmail);
    }
  } catch (error) {
    console.error("Failed to initialize admin user:", error);
  }
};

// Call initialization
initializeAdminUser();

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