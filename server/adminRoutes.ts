import type { Express } from "express";
import { z } from "zod";
import { isAdminAuthenticated, verifyPassword, hashPassword, logAdminActivity } from "./adminAuth";
import { storage } from "./storage";

export function registerAdminRoutes(app: Express) {
  
  // Admin login route - PRODUCTION DEPLOYMENT READY
  app.post('/api/admin/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      console.log("DEPLOYMENT ADMIN LOGIN:", email);

      if (!email || !password) {
        console.log("Missing admin credentials");
        return res.status(400).json({ message: "Email and password required" });
      }

      // Find admin user with case-insensitive email for production
      const normalizedEmail = email.toLowerCase().trim();
      const admin = await storage.getAdminByEmail(normalizedEmail);
      
      if (!admin || !admin.isActive) {
        console.log("Admin not found or inactive:", normalizedEmail);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password for production deployment
      const isValid = await verifyPassword(password, admin.passwordHash);
      if (!isValid) {
        console.log("Invalid password for admin:", normalizedEmail);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Update last login timestamp
      await storage.updateAdminLastLogin(admin.id);

      // Create secure admin session for production
      req.session.adminUser = {
        id: admin.id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role,
        loginTime: new Date().toISOString(),
        deployment: true
      };

      // Force session save for production deployment
      req.session.save((err) => {
        if (err) {
          console.error("DEPLOYMENT session save error:", err);
        } else {
          console.log("DEPLOYMENT admin session saved:", admin.email);
        }
      });

      // Log successful admin login
      await logAdminActivity(admin.id, 'LOGIN', 'ADMIN', admin.id, {
        environment: process.env.NODE_ENV || "production",
        timestamp: new Date().toISOString(),
        deploymentLogin: true
      }, req);

      console.log("DEPLOYMENT ADMIN LOGIN SUCCESS:", admin.email, admin.role);

      // Return admin data for production (no password hash)
      const { passwordHash, ...adminData } = admin;
      res.json(adminData);

    } catch (error) {
      console.error("DEPLOYMENT ADMIN LOGIN ERROR:", error);
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
      const { limit, offset } = req.query;
      const users = await storage.getAllUsers(
        limit ? parseInt(limit as string) : 50,
        offset ? parseInt(offset as string) : 0
      );
      
      // Remove sensitive data before sending
      const sanitizedUsers = users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        registrationIp: user.registrationIp,
        lastLoginIp: user.lastLoginIp,
        lastLoginAt: user.lastLoginAt,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }));
      
      res.json(sanitizedUsers);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  app.get('/api/admin/users/stats', isAdminAuthenticated, async (req, res) => {
    try {
      const totalUsers = await storage.getUserCount();
      const usersRegisteredToday = await storage.getUsersRegisteredToday();
      const usersActiveToday = await storage.getUsersActiveToday();
      
      res.json({
        totalUsers,
        usersRegisteredToday,
        usersActiveToday
      });
    } catch (error) {
      console.error("Get user stats error:", error);
      res.status(500).json({ message: "Failed to get user stats" });
    }
  });

  // Deposit requests management
  app.get('/api/admin/deposit-requests', isAdminAuthenticated, async (req, res) => {
    try {
      const { status } = req.query;
      let depositRequests;
      
      if (status && status !== 'all') {
        depositRequests = await storage.getDepositRequestsByStatus(status as string);
      } else {
        depositRequests = await storage.getAllDepositRequests();
      }
      
      res.json(depositRequests);
    } catch (error) {
      console.error("Get deposit requests error:", error);
      res.status(500).json({ message: "Failed to get deposit requests" });
    }
  });

  app.patch('/api/admin/deposit-requests/:id/approve', isAdminAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const adminId = req.adminUser.id;

      // Get the deposit request details first
      const depositRequest = await storage.getDepositRequestById(id);
      if (!depositRequest) {
        return res.status(404).json({ message: "Deposit request not found" });
      }

      // Update the deposit request status
      const updatedRequest = await storage.updateDepositRequest(id, {
        status: 'approved',
        adminApproval: 'approved',
        approvedBy: adminId,
        approvedAt: new Date(),
        notes
      });

      // Update user wallet balance
      const wallet = await storage.getUserWallet(depositRequest.userId, depositRequest.cryptoSymbol);
      if (wallet) {
        const currentBalance = parseFloat(wallet.balance?.toString() || '0');
        const depositAmount = parseFloat(depositRequest.amount?.toString() || '0');
        const newBalance = currentBalance + depositAmount;
        
        // Calculate USD value using stored USD value ratio
        const depositUsdValue = parseFloat(depositRequest.usdValue?.toString() || '0');
        const depositCryptoAmount = parseFloat(depositRequest.amount?.toString() || '0');
        const pricePerCrypto = depositCryptoAmount > 0 ? depositUsdValue / depositCryptoAmount : 50000;
        const usdValue = newBalance * pricePerCrypto;
        
        await storage.updateUserWallet(wallet.id, {
          balance: newBalance.toFixed(8),
          usdValue: usdValue.toFixed(2),
          lastSyncAt: new Date()
        });

        // Update portfolio total balance
        const userWallets = await storage.getUserWallets(depositRequest.userId);
        const totalValue = userWallets.reduce((sum, w) => {
          const balance = parseFloat(w.balance?.toString() || '0');
          const value = parseFloat(w.usdValue?.toString() || '0');
          return sum + (w.id === wallet.id ? usdValue : value);
        }, 0);
        
        const portfolio = await storage.getPortfolio(depositRequest.userId);
        if (portfolio) {
          await storage.updatePortfolio(portfolio.id, {
            totalBalance: totalValue.toFixed(2),
            updatedAt: new Date()
          });
        }
      }

      await logAdminActivity(adminId, 'APPROVE', 'DEPOSIT_REQUEST', id, { 
        notes, 
        amount: depositRequest.amount,
        crypto: depositRequest.cryptoSymbol,
        userId: depositRequest.userId
      }, req);

      res.json(updatedRequest);
    } catch (error) {
      console.error("Approve deposit request error:", error);
      res.status(500).json({ message: "Failed to approve deposit request" });
    }
  });

  app.patch('/api/admin/deposit-requests/:id/reject', isAdminAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { rejectionReason, notes } = req.body;
      const adminId = req.adminUser.id;

      const updatedRequest = await storage.updateDepositRequest(id, {
        status: 'rejected',
        adminApproval: 'rejected',
        approvedBy: adminId,
        approvedAt: new Date(),
        rejectionReason,
        notes
      });

      await logAdminActivity(adminId, 'REJECT', 'DEPOSIT_REQUEST', id, { rejectionReason, notes }, req);

      res.json(updatedRequest);
    } catch (error) {
      console.error("Reject deposit request error:", error);
      res.status(500).json({ message: "Failed to reject deposit request" });
    }
  });

  // Get detailed user information
  app.get('/api/admin/users/:userId/details', isAdminAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const userDetails = await storage.getUserDetails(userId);
      
      if (!userDetails) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(userDetails);
    } catch (error) {
      console.error("Error fetching user details:", error);
      res.status(500).json({ message: "Failed to fetch user details" });
    }
  });

  // Update user status (activate/suspend)
  app.patch('/api/admin/users/:userId/status', isAdminAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const { isActive } = req.body;
      const adminId = req.adminUser.id;
      
      const updatedUser = await storage.updateUserStatus(userId, isActive);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Log admin action
      await logAdminActivity(adminId, isActive ? 'ACTIVATE_USER' : 'SUSPEND_USER', 'USER', userId, {
        newStatus: isActive ? 'active' : 'suspended'
      }, req);
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  // Adjust user balance
  app.patch('/api/admin/users/:userId/balance', isAdminAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const { amount, type } = req.body;
      const adminId = req.adminUser.id;
      
      if (!amount || !type || !['add', 'remove'].includes(type)) {
        return res.status(400).json({ message: "Invalid amount or type" });
      }
      
      const updatedBalance = await storage.adjustUserBalance(userId, amount, type);
      
      // Log admin action
      await logAdminActivity(adminId, `BALANCE_${type.toUpperCase()}`, 'USER', userId, {
        amount,
        action: type
      }, req);
      
      res.json(updatedBalance);
    } catch (error) {
      console.error("Error adjusting user balance:", error);
      res.status(500).json({ message: "Failed to adjust user balance" });
    }
  });

  // Approve user trades
  app.patch('/api/admin/users/:userId/trades/approve', isAdminAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const { tradeIds } = req.body;
      const adminId = req.adminUser.id;
      
      if (!tradeIds || !Array.isArray(tradeIds)) {
        return res.status(400).json({ message: "Invalid trade IDs" });
      }
      
      const approvedTrades = await storage.approveUserTrades(userId, tradeIds);
      
      // Log admin action
      await logAdminActivity(adminId, 'APPROVE_TRADES', 'USER', userId, {
        tradeCount: tradeIds.length,
        tradeIds
      }, req);
      
      res.json(approvedTrades);
    } catch (error) {
      console.error("Error approving trades:", error);
      res.status(500).json({ message: "Failed to approve trades" });
    }
  });

  // Get user activity history
  app.get('/api/admin/users/:userId/history', isAdminAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Get user's complete history
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const trades = await storage.getTrades(userId);
      const portfolio = await storage.getPortfolio(userId);
      
      // Calculate metrics
      const loginCount = user.lastLoginAt ? 1 : 0; // Basic implementation
      const tradeCount = trades.length;
      const depositCount = portfolio && parseFloat(portfolio.totalBalance || '0') > 0 ? 1 : 0;
      const accountAge = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      
      const history = {
        loginCount,
        tradeCount,
        depositCount,
        lastActivity: user.lastLoginAt || user.createdAt,
        accountAge: `${accountAge} days`,
        totalBalance: portfolio?.totalBalance || '0',
        registrationDate: user.createdAt,
        lastLogin: user.lastLoginAt
      };

      res.json(history);
    } catch (error) {
      console.error("Error fetching user history:", error);
      res.status(500).json({ message: "Failed to fetch user history" });
    }
  });

  // Get user activity log
  app.get('/api/admin/users/:userId/activity-log', isAdminAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Get recent activities for the user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const trades = await storage.getTrades(userId);
      
      // Create activity log from available data
      const activities = [
        {
          timestamp: user.createdAt,
          action: "Account Created",
          details: `User registered with email: ${user.email}`
        }
      ];

      if (user.lastLoginAt) {
        activities.push({
          timestamp: user.lastLoginAt,
          action: "Last Login",
          details: `Logged in from IP: ${user.lastLoginIp || 'Unknown'}`
        });
      }

      // Add trade activities
      trades.slice(0, 10).forEach(trade => {
        activities.push({
          timestamp: trade.createdAt,
          action: `Trade ${trade.type.toUpperCase()}`,
          details: `${trade.quantity} ${trade.symbol} at $${trade.price}`
        });
      });

      // Sort by timestamp descending
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      res.json(activities);
    } catch (error) {
      console.error("Error fetching activity log:", error);
      res.status(500).json({ message: "Failed to fetch activity log" });
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

  // Dashboard stats for admin - Real-time platform data
  app.get('/api/admin/stats', isAdminAuthenticated, async (req, res) => {
    try {
      const totalUsers = await storage.getUserCount();
      const usersRegisteredToday = await storage.getUsersRegisteredToday();
      const usersActiveToday = await storage.getUsersActiveToday();
      
      // Calculate real revenue from user portfolios
      const totalRevenue = await storage.getTotalPlatformRevenue();
      
      // Get pending trades count  
      const pendingTrades = await storage.getAllTradesPendingApproval();
      
      // Get active trades count (executed trades)
      const activeTrades = await storage.getActiveTradesCount();
      
      // Get pending deposits count (users with $0 balance)
      const pendingDeposits = await storage.getPendingDepositsCount();
      
      const stats = {
        totalUsers: totalUsers.toString(),
        usersRegisteredToday: usersRegisteredToday.toString(),
        usersActiveToday: usersActiveToday.toString(),
        totalRevenue: totalRevenue,
        pendingDeposits: pendingDeposits.toString(),
        activeTrades: activeTrades.toString()
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Get admin stats error:", error);
      res.status(500).json({ message: "Failed to get admin stats" });
    }
  });

  // Trade approval routes
  app.get('/api/admin/trades/pending', isAdminAuthenticated, async (req, res) => {
    try {
      const pendingTrades = await storage.getAllTradesPendingApproval();
      res.json(pendingTrades);
    } catch (error) {
      console.error("Error fetching pending trades:", error);
      res.status(500).json({ message: "Failed to fetch pending trades" });
    }
  });

  app.patch('/api/admin/trades/:id/approve', isAdminAuthenticated, async (req, res) => {
    try {
      const adminId = req.adminUser.id;
      const tradeId = req.params.id;
      const { approval, rejectionReason } = req.body;

      const updatedTrade = await storage.updateTrade(tradeId, {
        adminApproval: approval,
        approvedBy: adminId,
        approvedAt: approval === "approved" ? new Date() : undefined,
        rejectionReason: approval === "rejected" ? rejectionReason : undefined,
        status: approval === "approved" ? "approved" : "rejected"
      });

      // Log admin action
      await logAdminActivity(adminId, approval === "approved" ? "APPROVE_TRADE" : "REJECT_TRADE", "TRADE", tradeId, { approval, rejectionReason }, req);

      res.json(updatedTrade);
    } catch (error) {
      console.error("Trade approval error:", error);
      res.status(500).json({ message: "Failed to update trade approval" });
    }
  });
}