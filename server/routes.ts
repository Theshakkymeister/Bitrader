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
import { updatePositionValues, getAllPrices, getCurrentPrice } from "./marketData";

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

  // Get crypto deposit addresses managed by admin
  app.get('/api/crypto-addresses', isAuthenticated, async (req: any, res) => {
    try {
      const addresses = await storage.getCryptoAddresses();
      res.json(addresses);
    } catch (error) {
      console.error("Error fetching crypto addresses:", error);
      res.status(500).json({ message: "Failed to fetch crypto addresses" });
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

  // Get user trading positions with real-time prices
  app.get('/api/positions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const positions = await storage.getUserPositions(userId);
      
      // Update positions with live market prices
      const positionsWithLivePrices = updatePositionValues(positions);
      
      res.json(positionsWithLivePrices);
    } catch (error) {
      console.error("Error fetching positions:", error);
      res.status(500).json({ message: "Failed to fetch positions" });
    }
  });

  // Get real-time market prices
  app.get('/api/market-prices', async (req, res) => {
    try {
      const prices = getAllPrices();
      res.json(prices);
    } catch (error) {
      console.error("Error fetching market prices:", error);
      res.status(500).json({ message: "Failed to fetch market prices" });
    }
  });

  // Get specific asset price
  app.get('/api/market-prices/:symbol', async (req, res) => {
    try {
      const { symbol } = req.params;
      const price = getCurrentPrice(symbol.toUpperCase());
      
      if (!price) {
        return res.status(404).json({ message: "Asset not found" });
      }
      
      res.json(price);
    } catch (error) {
      console.error("Error fetching asset price:", error);
      res.status(500).json({ message: "Failed to fetch asset price" });
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

  // Update wallet balance (for deposit approvals)
  app.patch('/api/wallets/:symbol/balance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { symbol } = req.params;
      const { amount, operation = 'add' } = req.body;
      
      if (!amount || isNaN(parseFloat(amount))) {
        return res.status(400).json({ message: "Valid amount is required" });
      }
      
      const wallet = await storage.getUserWallet(userId, symbol.toUpperCase());
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }
      
      const currentBalance = parseFloat(wallet.balance?.toString() || '0');
      const changeAmount = parseFloat(amount);
      
      let newBalance: number;
      if (operation === 'add') {
        newBalance = currentBalance + changeAmount;
      } else if (operation === 'subtract') {
        newBalance = Math.max(0, currentBalance - changeAmount);
      } else {
        return res.status(400).json({ message: "Operation must be 'add' or 'subtract'" });
      }
      
      // Get current market price for USD value calculation (simplified)
      const usdValue = newBalance * 50000; // Placeholder price calculation
      
      const updatedWallet = await storage.updateUserWallet(wallet.id, {
        balance: newBalance.toFixed(8),
        usdValue: usdValue.toFixed(2),
        lastSyncAt: new Date()
      });
      
      // Update portfolio total balance
      const userWallets = await storage.getUserWallets(userId);
      const totalValue = userWallets.reduce((sum, w) => {
        const balance = parseFloat(w.balance?.toString() || '0');
        const value = parseFloat(w.usdValue?.toString() || '0');
        return sum + (w.id === wallet.id ? usdValue : value);
      }, 0);
      
      const portfolio = await storage.getPortfolio(userId);
      if (portfolio) {
        await storage.updatePortfolio(portfolio.id, {
          totalBalance: totalValue.toFixed(2),
          updatedAt: new Date()
        });
      }
      
      res.json(updatedWallet);
    } catch (error) {
      console.error("Error updating wallet balance:", error);
      res.status(500).json({ message: "Failed to update wallet balance" });
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

  // User portfolio - REAL DATA with calculated total value
  app.get('/api/portfolio', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const portfolio = await storage.getPortfolio(userId);
      
      // Get user wallets for total value calculation
      const wallets = await storage.getUserWallets(userId);
      const stockHoldings = await storage.getUserStockHoldings(userId);
      
      // Calculate real-time total value from wallets + stock holdings
      const totalWalletValue = wallets.reduce((sum, wallet) => {
        return sum + parseFloat(wallet.usdValue?.toString() || '0');
      }, 0);
      
      const totalStockValue = stockHoldings.reduce((sum, holding) => {
        return sum + parseFloat(holding.marketValue?.toString() || '0');
      }, 0);
      
      const totalValue = totalWalletValue + totalStockValue;
      
      console.log('Portfolio calculation:', {
        totalWalletValue,
        totalStockValue, 
        totalValue,
        walletsCount: wallets.length,
        stockHoldingsCount: stockHoldings.length
      });
      
      // Calculate total profit/loss from all trades
      const allTrades = await storage.getTrades(userId);
      const totalProfitLoss = allTrades.reduce((sum, trade) => {
        return sum + parseFloat(trade.profitLoss?.toString() || '0');
      }, 0);
      
      // Calculate win rate
      const completedTrades = allTrades.filter(t => t.status === 'closed' && t.profitLoss);
      const winningTrades = completedTrades.filter(t => parseFloat(t.profitLoss?.toString() || '0') > 0);
      const winRate = completedTrades.length > 0 ? (winningTrades.length / completedTrades.length) * 100 : 0;
      
      // Enhance portfolio with calculated values
      const enhancedPortfolio = portfolio ? {
        ...portfolio,
        totalBalance: parseFloat(portfolio.totalBalance?.toString() || '0'),
        totalProfitLoss: totalProfitLoss,
        todayPL: parseFloat(portfolio.todayPL?.toString() || '0'),
        winRate: winRate,
        totalValue: totalValue,
        walletValue: totalWalletValue,
        stockValue: totalStockValue
      } : {
        totalBalance: 0,
        totalProfitLoss: totalProfitLoss,
        todayPL: 0,
        winRate: winRate,
        totalValue: totalValue,
        walletValue: totalWalletValue,
        stockValue: totalStockValue,
        activeAlgorithms: 0
      };
      
      console.log('Enhanced portfolio response:', enhancedPortfolio);
      res.json(enhancedPortfolio);
    } catch (error) {
      console.error("Error fetching portfolio:", error);
      res.status(500).json({ message: "Failed to fetch portfolio" });
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
      console.log("Creating trade for user:", userId);
      console.log("Request body:", req.body);
      
      // Extract only the fields that exist in the database schema
      const tradeData = {
        userId,
        symbol: req.body.symbol,
        assetType: req.body.assetType || 'stock',
        type: req.body.type,
        orderType: req.body.orderType || 'market',
        quantity: req.body.quantity,
        price: req.body.price,
        entryPrice: req.body.entryPrice,
        limitPrice: req.body.limitPrice || null,
        stopPrice: req.body.stopPrice || null,
        totalAmount: req.body.totalAmount,
        currentPrice: req.body.price, // Set current price to entry price initially
        status: req.body.status || 'pending_approval',
        adminApproval: req.body.adminApproval || 'pending',
        isOpen: true
      };
      
      console.log("Trade data to insert:", tradeData);
      const trade = await storage.createTrade(tradeData);
      console.log("Trade created successfully:", trade);
      res.json(trade);
    } catch (error) {
      console.error("Error creating trade - Full error:", error);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      res.status(500).json({ message: "Failed to create trade", error: error.message });
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
      
      // Enhance trades with real-time market prices
      const tradesWithLivePrices = trades.map(trade => {
        const currentPrice = getCurrentPrice(trade.symbol);
        if (currentPrice && trade.quantity) {
          const quantity = parseFloat(trade.quantity);
          const currentValue = quantity * currentPrice.price;
          const originalValue = parseFloat(trade.totalAmount || '0');
          const profitLoss = currentValue - originalValue;
          const profitLossPercentage = originalValue > 0 ? (profitLoss / originalValue) * 100 : 0;

          return {
            ...trade,
            currentPrice: currentPrice.price.toString(),
            currentValue: currentValue.toString(),
            profitLoss: profitLoss.toString(),
            profitLossPercentage: profitLossPercentage.toString()
          };
        }
        return trade;
      });
      
      res.json(tradesWithLivePrices);
    } catch (error) {
      console.error("Error fetching trades:", error);
      res.status(500).json({ message: "Failed to fetch trades" });
    }
  });

  // Close a trade position and realize profits/losses
  app.patch('/api/trades/:tradeId/close', isAuthenticated, async (req: any, res) => {
    try {
      const { tradeId } = req.params;
      const userId = req.user.id;
      
      // Verify the trade belongs to the user
      const trade = await storage.getTradeById(tradeId);
      if (!trade || trade.userId !== userId) {
        return res.status(404).json({ message: "Trade not found" });
      }
      
      if (!trade.isOpen) {
        return res.status(400).json({ message: "Trade is already closed" });
      }
      
      if (trade.adminApproval !== 'approved') {
        return res.status(400).json({ message: "Trade must be approved before closing" });
      }
      
      // Close the trade and realize profits/losses
      const closedTrade = await storage.closeTrade(tradeId);
      
      // Update user portfolio balance with realized profits
      if (closedTrade.profitLoss) {
        await storage.updatePortfolioBalance(userId, parseFloat(closedTrade.profitLoss));
      }
      
      res.json(closedTrade);
    } catch (error) {
      console.error("Error closing trade:", error);
      res.status(500).json({ message: "Failed to close trade" });
    }
  });

  // Update trade current price for P&L calculation
  app.patch('/api/trades/:tradeId/price', isAuthenticated, async (req: any, res) => {
    try {
      const { tradeId } = req.params;
      const { currentPrice } = req.body;
      const userId = req.user.id;
      
      // Verify the trade belongs to the user
      const trade = await storage.getTradeById(tradeId);
      if (!trade || trade.userId !== userId) {
        return res.status(404).json({ message: "Trade not found" });
      }
      
      if (!trade.isOpen || trade.adminApproval !== 'approved') {
        return res.status(400).json({ message: "Can only update price for open approved trades" });
      }
      
      // Update current price and calculate P&L
      const updatedTrade = await storage.updateTradePrice(tradeId, currentPrice);
      
      res.json(updatedTrade);
    } catch (error) {
      console.error("Error updating trade price:", error);
      res.status(500).json({ message: "Failed to update trade price" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
