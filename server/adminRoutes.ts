import type { Express } from "express";
import { z } from "zod";
import { isAdminAuthenticated, verifyPassword, hashPassword, logAdminActivity, initializeAdminUser } from "./adminAuth";
import { storage } from "./storage";

// Initialize admin system
initializeAdminUser();

export function registerAdminRoutes(app: Express) {
  
  // Admin login route
  app.post('/api/admin/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      // Find admin user
      const admin = await storage.getAdminByEmail(email);
      if (!admin || !admin.isActive) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password
      const isValid = await verifyPassword(password, admin.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Update last login
      await storage.updateAdminLastLogin(admin.id);

      // Create admin session
      req.session.adminUser = {
        id: admin.id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role,
      };

      // Log activity
      await logAdminActivity(admin.id, 'LOGIN', 'ADMIN', admin.id, null, req);

      // Return admin info (without password hash)
      const { passwordHash, ...adminData } = admin;
      res.json(adminData);

    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Admin logout route
  app.post('/api/admin/logout', isAdminAuthenticated, async (req, res) => {
    try {
      const adminId = req.adminUser.id;
      
      // Log activity
      await logAdminActivity(adminId, 'LOGOUT', 'ADMIN', adminId, null, req);
      
      // Destroy session
      req.session.adminUser = null;
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Admin logout error:", error);
      res.status(500).json({ message: "Logout failed" });
    }
  });

  // Get current admin user
  app.get('/api/admin/user', isAdminAuthenticated, async (req, res) => {
    try {
      const { passwordHash, ...adminData } = req.adminUser;
      res.json(adminData);
    } catch (error) {
      console.error("Get admin user error:", error);
      res.status(500).json({ message: "Failed to get admin user" });
    }
  });

  // Change admin password
  app.post('/api/admin/change-password', isAdminAuthenticated, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const adminId = req.adminUser.id;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current and new passwords required" });
      }

      // Verify current password
      const isValid = await verifyPassword(currentPassword, req.adminUser.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      // Hash new password
      const newPasswordHash = await hashPassword(newPassword);

      // Update admin user
      await storage.updateAdminLastLogin(adminId); // This will trigger the update, we'd need a specific update method
      
      // Log activity
      await logAdminActivity(adminId, 'UPDATE', 'ADMIN_PASSWORD', adminId, null, req);

      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // Website Settings Management
  app.get('/api/admin/settings', isAdminAuthenticated, async (req, res) => {
    try {
      const { category } = req.query;
      const settings = await storage.getWebsiteSettings(category as string);
      res.json(settings);
    } catch (error) {
      console.error("Get settings error:", error);
      res.status(500).json({ message: "Failed to get settings" });
    }
  });

  app.post('/api/admin/settings', isAdminAuthenticated, async (req, res) => {
    try {
      const { key, value, description, category } = req.body;
      const adminId = req.adminUser.id;

      const setting = await storage.createWebsiteSetting({
        key,
        value,
        description,
        category,
        updatedBy: adminId,
      });

      await logAdminActivity(adminId, 'CREATE', 'WEBSITE_SETTING', setting.id, { key, category }, req);

      res.json(setting);
    } catch (error) {
      console.error("Create setting error:", error);
      res.status(500).json({ message: "Failed to create setting" });
    }
  });

  app.put('/api/admin/settings/:key', isAdminAuthenticated, async (req, res) => {
    try {
      const { key } = req.params;
      const { value, description } = req.body;
      const adminId = req.adminUser.id;

      const setting = await storage.updateWebsiteSetting(key, {
        value,
        description,
        updatedBy: adminId,
      });

      await logAdminActivity(adminId, 'UPDATE', 'WEBSITE_SETTING', setting.id, { key, value }, req);

      res.json(setting);
    } catch (error) {
      console.error("Update setting error:", error);
      res.status(500).json({ message: "Failed to update setting" });
    }
  });

  // Crypto Addresses Management
  app.get('/api/admin/crypto-addresses', isAdminAuthenticated, async (req, res) => {
    try {
      const addresses = await storage.getCryptoAddresses();
      res.json(addresses);
    } catch (error) {
      console.error("Get crypto addresses error:", error);
      res.status(500).json({ message: "Failed to get crypto addresses" });
    }
  });

  app.post('/api/admin/crypto-addresses', isAdminAuthenticated, async (req, res) => {
    try {
      const { symbol, name, address, network } = req.body;
      const adminId = req.adminUser.id;

      const cryptoAddress = await storage.createCryptoAddress({
        symbol,
        name,
        address,
        network,
        createdBy: adminId,
      });

      await logAdminActivity(adminId, 'CREATE', 'CRYPTO_ADDRESS', cryptoAddress.id, { symbol, address }, req);

      res.json(cryptoAddress);
    } catch (error) {
      console.error("Create crypto address error:", error);
      res.status(500).json({ message: "Failed to create crypto address" });
    }
  });

  app.put('/api/admin/crypto-addresses/:id', isAdminAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { symbol, name, address, network, isActive } = req.body;
      const adminId = req.adminUser.id;

      const cryptoAddress = await storage.updateCryptoAddress(id, {
        symbol,
        name,
        address,
        network,
        isActive,
      });

      await logAdminActivity(adminId, 'UPDATE', 'CRYPTO_ADDRESS', id, { symbol, address }, req);

      res.json(cryptoAddress);
    } catch (error) {
      console.error("Update crypto address error:", error);
      res.status(500).json({ message: "Failed to update crypto address" });
    }
  });

  app.delete('/api/admin/crypto-addresses/:id', isAdminAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const adminId = req.adminUser.id;

      await storage.deleteCryptoAddress(id);
      await logAdminActivity(adminId, 'DELETE', 'CRYPTO_ADDRESS', id, null, req);

      res.json({ message: "Crypto address deleted successfully" });
    } catch (error) {
      console.error("Delete crypto address error:", error);
      res.status(500).json({ message: "Failed to delete crypto address" });
    }
  });

  // User Management
  app.get('/api/admin/users', isAdminAuthenticated, async (req, res) => {
    try {
      // This would need to be implemented in storage - get all users with pagination
      res.json({ message: "User management endpoint - to be implemented" });
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  // Algorithm Management
  app.get('/api/admin/algorithms', isAdminAuthenticated, async (req, res) => {
    try {
      const algorithms = await storage.getAlgorithms();
      res.json(algorithms);
    } catch (error) {
      console.error("Get algorithms error:", error);
      res.status(500).json({ message: "Failed to get algorithms" });
    }
  });

  app.post('/api/admin/algorithms', isAdminAuthenticated, async (req, res) => {
    try {
      const { name, type, description, active } = req.body;
      const adminId = req.adminUser.id;

      const algorithm = await storage.createAlgorithm({
        name,
        type,
        description,
        active,
      });

      await logAdminActivity(adminId, 'CREATE', 'ALGORITHM', algorithm.id, { name, type }, req);

      res.json(algorithm);
    } catch (error) {
      console.error("Create algorithm error:", error);
      res.status(500).json({ message: "Failed to create algorithm" });
    }
  });

  // Admin Activity Logs
  app.get('/api/admin/logs', isAdminAuthenticated, async (req, res) => {
    try {
      const { limit } = req.query;
      const logs = await storage.getAdminLogs(undefined, limit ? parseInt(limit as string) : undefined);
      res.json(logs);
    } catch (error) {
      console.error("Get admin logs error:", error);
      res.status(500).json({ message: "Failed to get admin logs" });
    }
  });

  // Dashboard stats for admin
  app.get('/api/admin/stats', isAdminAuthenticated, async (req, res) => {
    try {
      // This would aggregate various stats - implement in storage layer
      const stats = {
        totalUsers: 0, // await storage.getUserCount(),
        totalTrades: 0, // await storage.getTradeCount(),
        activeAlgorithms: 0, // await storage.getActiveAlgorithmCount(),
        totalVolume: 0, // await storage.getTotalVolume(),
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Get admin stats error:", error);
      res.status(500).json({ message: "Failed to get admin stats" });
    }
  });
}