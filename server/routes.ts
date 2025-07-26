import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";

// Authentication middleware
const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};
import { registerAdminRoutes } from "./adminRoutes";
import { externalAPI } from "./externalAPI";
import { z } from "zod";
import { insertTradeSchema, insertPerformanceMetricSchema } from "@shared/schema";
import { initializeUserPortfolio, runSeedOperations } from "./seedData";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize seed data
  await runSeedOperations();
  
  // Auth middleware
  setupAuth(app);
  
  // Register admin routes
  registerAdminRoutes(app);

  // User routes (handled by auth.ts)

  // Portfolio routes - REAL USER DATA for live cryptocurrency trading
  app.get('/api/portfolio', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      let portfolio = await storage.getPortfolio(userId);
      
      if (!portfolio) {
        // Create real portfolio for new user (no demo data)
        portfolio = await storage.createPortfolio({
          userId,
          totalBalance: '0.00',
          todayPL: '0.00',
          winRate: '0.00',
          activeAlgorithms: 0
        });
      }
      
      res.json(portfolio);
    } catch (error) {
      console.error("Error fetching portfolio:", error);
      res.status(500).json({ message: "Failed to fetch portfolio" });
    }
  });

  // User crypto wallets - REAL CRYPTOCURRENCY BALANCES
  app.get('/api/wallets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      let wallets = await storage.getUserWallets(userId);
      
      // Initialize empty crypto wallets for new user (real accounts)
      if (wallets.length === 0) {
        const cryptoWallets = [
          { symbol: 'BTC', name: 'Bitcoin' },
          { symbol: 'ETH', name: 'Ethereum' },
          { symbol: 'SOL', name: 'Solana' },
          { symbol: 'USDT', name: 'Tether' },
          { symbol: 'USDC', name: 'USD Coin' }
        ];
        
        for (const crypto of cryptoWallets) {
          await storage.createUserWallet({
            userId,
            symbol: crypto.symbol,
            name: crypto.name,
            balance: '0.00000000',
            usdValue: '0.00',
            isConnected: false
          });
        }
        
        wallets = await storage.getUserWallets(userId);
      }
      
      res.json(wallets);
    } catch (error) {
      console.error("Error fetching wallets:", error);
      res.status(500).json({ message: "Failed to fetch wallets" });
    }
  });

  // Connect external wallet (Trust Wallet, Coinbase)
  app.post('/api/wallets/:symbol/connect', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { symbol } = req.params;
      const { walletType, walletAddress } = req.body;
      
      const wallet = await storage.getUserWallet(userId, symbol);
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }
      
      const updatedWallet = await storage.updateUserWallet(wallet.id, {
        walletType,
        walletAddress,
        isConnected: true,
        lastSyncAt: new Date()
      });
      
      res.json(updatedWallet);
    } catch (error) {
      console.error("Error connecting wallet:", error);
      res.status(500).json({ message: "Failed to connect wallet" });
    }
  });

  // Stock holdings - REAL STOCK POSITIONS
  app.get('/api/stocks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      let holdings = await storage.getStockHoldings(userId);
      
      // Initialize empty stock positions for new user
      if (holdings.length === 0) {
        const stocks = [
          { symbol: 'AAPL', name: 'Apple Inc.' },
          { symbol: 'TSLA', name: 'Tesla Inc.' },
          { symbol: 'GOOGL', name: 'Alphabet Inc.' },
          { symbol: 'MSFT', name: 'Microsoft Corp.' }
        ];
        
        for (const stock of stocks) {
          await storage.createStockHolding({
            userId,
            symbol: stock.symbol,
            name: stock.name,
            shares: '0.000000',
            avgCostBasis: '0.0000',
            currentPrice: '0.0000',
            marketValue: '0.00',
            totalReturn: '0.00',
            returnPercentage: '0.00'
          });
        }
        
        holdings = await storage.getStockHoldings(userId);
      }
      
      res.json(holdings);
    } catch (error) {
      console.error("Error fetching stock holdings:", error);
      res.status(500).json({ message: "Failed to fetch stock holdings" });
    }
  });

  // Trading algorithms
  app.get('/api/algorithms', isAuthenticated, async (req, res) => {
    try {
      const algorithms = await storage.getAlgorithms();
      res.json(algorithms);
    } catch (error) {
      console.error("Error fetching algorithms:", error);
      res.status(500).json({ message: "Failed to fetch algorithms" });
    }
  });

  // User trades - REAL TRADING HISTORY
  app.get('/api/trades', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 50;
      const trades = await storage.getTrades(userId, limit);
      res.json(trades);
    } catch (error) {
      console.error("Error fetching trades:", error);
      res.status(500).json({ message: "Failed to fetch trades" });
    }
  });

  // Performance metrics - REAL ANALYTICS
  app.get('/api/performance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const algorithmId = req.query.algorithmId as string;
      const metrics = await storage.getPerformanceMetrics(userId, algorithmId);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching performance metrics:", error);
      res.status(500).json({ message: "Failed to fetch performance metrics" });
    }
  });

  // Create new trade (for live trading)
  app.post('/api/trades', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = insertTradeSchema.parse({ ...req.body, userId });
      const trade = await storage.createTrade(validatedData);
      res.json(trade);
    } catch (error) {
      console.error("Error creating trade:", error);
      res.status(500).json({ message: "Failed to create trade" });
    }
  });

  // Create performance metric
  app.post('/api/performance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = insertPerformanceMetricSchema.parse({ ...req.body, userId });
      const metric = await storage.createPerformanceMetric(validatedData);
      res.json(metric);
    } catch (error) {
      console.error("Error creating performance metric:", error);
      res.status(500).json({ message: "Failed to create performance metric" });
    }
  });

  // External API integration routes
  app.post('/api/sync/connect', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { apiKey, externalUserId } = req.body;
      
      if (!apiKey || !externalUserId) {
        return res.status(400).json({ message: "API key and external user ID are required" });
      }
      
      // Test connection to external API
      const isValid = await externalAPI.testConnection(apiKey, externalUserId);
      if (!isValid) {
        return res.status(400).json({ message: "Invalid API credentials or connection failed" });
      }
      
      // Update user with API credentials
      const user = await storage.getUser(userId);
      if (user) {
        await storage.upsertUser({
          ...user,
          apiKey,
          externalUserId,
        });
        
        // Start initial sync
        await externalAPI.syncUserData({ ...user, apiKey, externalUserId });
        
        res.json({ message: "Successfully connected to your trading account" });
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Error connecting external API:", error);
      res.status(500).json({ message: "Failed to connect external API" });
    }
  });
  
  app.post('/api/sync/manual', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.apiKey || !user?.externalUserId) {
        return res.status(400).json({ message: "External API not configured" });
      }
      
      await externalAPI.syncUserData(user);
      res.json({ message: "Data synchronized successfully" });
    } catch (error) {
      console.error("Error syncing data:", error);
      res.status(500).json({ message: "Failed to sync data" });
    }
  });

  // Trading API routes
  app.post('/api/trades', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const trade = await storage.createTrade({
        ...req.body,
        userId,
        status: "pending_approval",
        adminApproval: "pending"
      });

      console.log("Trade created:", trade.id, "for user:", userId);
      res.status(201).json(trade);
    } catch (error) {
      console.error("Trade creation error:", error);
      res.status(500).json({ message: "Failed to create trade" });
    }
  });

  app.get('/api/trades', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const trades = await storage.getTrades(userId);
      res.json(trades);
    } catch (error) {
      console.error("Error fetching trades:", error);
      res.status(500).json({ message: "Failed to fetch trades" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
