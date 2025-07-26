import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertTradeSchema, insertPerformanceMetricSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
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
        // Create initial portfolio for new user
        portfolio = await storage.createPortfolio({
          userId,
          totalBalance: '0',
          todayPL: '0',
          winRate: '0',
          activeAlgorithms: 0,
        });
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

  const httpServer = createServer(app);
  return httpServer;
}
