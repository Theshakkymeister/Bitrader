import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { registerAdminRoutes } from "./adminRoutes";
import { externalAPI } from "./externalAPI";
import { z } from "zod";
import { insertTradeSchema, insertPerformanceMetricSchema } from "@shared/schema";
import { initializeUserPortfolio, runSeedOperations } from "./seedData";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize seed data
  await runSeedOperations();
  
  // Auth middleware
  await setupAuth(app);
  
  // Register admin routes
  registerAdminRoutes(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Auto-sync data if user has API credentials and last sync was more than 5 minutes ago
      if (user?.apiKey && user?.externalUserId) {
        const shouldSync = !user.lastSyncAt || 
          (new Date().getTime() - new Date(user.lastSyncAt).getTime()) > 5 * 60 * 1000;
        
        if (shouldSync) {
          // Sync in background
          externalAPI.syncUserData(user).catch(console.error);
        }
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Portfolio routes
  app.get('/api/portfolio', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let portfolio = await storage.getPortfolio(userId);
      
      if (!portfolio) {
        // Initialize portfolio with demo data for new user
        portfolio = await initializeUserPortfolio(userId);
      }
      
      res.json(portfolio);
    } catch (error) {
      console.error("Error fetching portfolio:", error);
      res.status(500).json({ message: "Failed to fetch portfolio" });
    }
  });

  // Algorithm routes
  app.get('/api/algorithms', isAuthenticated, async (req, res) => {
    try {
      const algorithms = await storage.getAlgorithms();
      res.json(algorithms);
    } catch (error) {
      console.error("Error fetching algorithms:", error);
      res.status(500).json({ message: "Failed to fetch algorithms" });
    }
  });

  // Trade routes
  app.get('/api/trades', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const trades = await storage.getTrades(userId, limit);
      res.json(trades);
    } catch (error) {
      console.error("Error fetching trades:", error);
      res.status(500).json({ message: "Failed to fetch trades" });
    }
  });

  app.post('/api/trades', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertTradeSchema.parse({ ...req.body, userId });
      const trade = await storage.createTrade(validatedData);
      res.json(trade);
    } catch (error) {
      console.error("Error creating trade:", error);
      res.status(500).json({ message: "Failed to create trade" });
    }
  });

  // Performance metrics routes
  app.get('/api/performance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const algorithmId = req.query.algorithmId as string;
      const metrics = await storage.getPerformanceMetrics(userId, algorithmId);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching performance metrics:", error);
      res.status(500).json({ message: "Failed to fetch performance metrics" });
    }
  });

  app.post('/api/performance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  const httpServer = createServer(app);
  return httpServer;
}
