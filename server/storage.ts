import {
  users,
  portfolios,
  trades,
  algorithms,
  performanceMetrics,
  userWallets,
  stockHoldings,
  adminUsers,
  websiteSettings,
  cryptoAddresses,
  adminLogs,
  depositRequests,
  type User,
  type UpsertUser,
  type Portfolio,
  type InsertPortfolio,
  type Trade,
  type InsertTrade,
  type Algorithm,
  type InsertAlgorithm,
  type PerformanceMetric,
  type InsertPerformanceMetric,
  type UserWallet,
  type InsertUserWallet,
  type StockHolding,
  type InsertStockHolding,
  type AdminUser,
  type InsertAdminUser,
  type WebsiteSetting,
  type InsertWebsiteSetting,
  type CryptoAddress,
  type InsertCryptoAddress,
  type AdminLog,
  type InsertAdminLog,
  type DepositRequest,
  type InsertDepositRequest,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
import type { Store } from "express-session";
import createMemoryStore from "memorystore";
import session from "express-session";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // Session store
  sessionStore: Store;
  
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Omit<UpsertUser, 'id'>): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserLoginInfo(userId: string, ipAddress: string): Promise<void>;
  
  // Admin user management operations
  getAllUsers(limit?: number, offset?: number): Promise<User[]>;
  getUserCount(): Promise<number>;
  getUsersRegisteredToday(): Promise<number>;
  getUsersActiveToday(): Promise<number>;
  updateUserLastLogin(id: string, ipAddress: string): Promise<User>;
  getUserDetails(id: string): Promise<any>;
  updateUserStatus(id: string, isActive: boolean): Promise<User>;
  adjustUserBalance(id: string, amount: number, type: 'add' | 'remove'): Promise<any>;
  addUserProfit(userId: string, amount: number): Promise<any>;
  approveUserTrades(userId: string, tradeIds: string[]): Promise<any>;
  
  // Real-time analytics methods
  getTotalPlatformRevenue(): Promise<string>;
  getPendingTradesCount(): Promise<number>;
  getActiveTradesCount(): Promise<number>;
  getPendingDepositsCount(): Promise<number>;
  
  // Portfolio operations
  getPortfolio(userId: string): Promise<Portfolio | undefined>;
  createPortfolio(portfolio: InsertPortfolio): Promise<Portfolio>;
  updatePortfolio(userId: string, updates: Partial<InsertPortfolio>): Promise<Portfolio>;
  
  // Algorithm operations
  getAlgorithms(): Promise<Algorithm[]>;
  getAlgorithm(id: string): Promise<Algorithm | undefined>;
  createAlgorithm(algorithm: InsertAlgorithm): Promise<Algorithm>;
  
  // Trade operations
  getTrades(userId: string, limit?: number): Promise<Trade[]>;
  createTrade(trade: InsertTrade): Promise<Trade>;
  updateTrade(id: string, updates: Partial<InsertTrade>): Promise<Trade>;
  
  // Performance metrics operations
  getPerformanceMetrics(userId: string, algorithmId?: string): Promise<PerformanceMetric[]>;
  createPerformanceMetric(metric: InsertPerformanceMetric): Promise<PerformanceMetric>;
  updatePerformanceMetric(id: string, updates: Partial<InsertPerformanceMetric>): Promise<PerformanceMetric>;
  
  // User wallet operations
  getUserWallets(userId: string): Promise<UserWallet[]>;
  getUserWallet(userId: string, symbol: string): Promise<UserWallet | undefined>;
  createUserWallet(wallet: InsertUserWallet): Promise<UserWallet>;
  updateUserWallet(id: string, updates: Partial<InsertUserWallet>): Promise<UserWallet>;
  
  // Stock holding operations
  getStockHoldings(userId: string): Promise<StockHolding[]>;
  getStockHolding(userId: string, symbol: string): Promise<StockHolding | undefined>;
  createStockHolding(holding: InsertStockHolding): Promise<StockHolding>;
  updateStockHolding(id: string, updates: Partial<InsertStockHolding>): Promise<StockHolding>;
  
  // Trade profit tracking methods
  getTradeById(id: string): Promise<Trade | undefined>;
  closeTrade(id: string): Promise<Trade>;
  updateTradePrice(id: string, currentPrice: number): Promise<Trade>;
  updatePortfolioBalance(userId: string, amount: number): Promise<Portfolio>;
  
  // Admin operations
  getAdminByEmail(email: string): Promise<AdminUser | undefined>;
  createAdmin(admin: InsertAdminUser): Promise<AdminUser>;
  updateAdminLastLogin(id: string): Promise<AdminUser>;
  
  // Website settings operations
  getWebsiteSettings(category?: string): Promise<WebsiteSetting[]>;
  getWebsiteSetting(key: string): Promise<WebsiteSetting | undefined>;
  createWebsiteSetting(setting: InsertWebsiteSetting): Promise<WebsiteSetting>;
  updateWebsiteSetting(key: string, updates: Partial<InsertWebsiteSetting>): Promise<WebsiteSetting>;
  
  // Crypto addresses operations
  getCryptoAddresses(): Promise<CryptoAddress[]>;
  getCryptoAddress(symbol: string): Promise<CryptoAddress | undefined>;
  createCryptoAddress(address: InsertCryptoAddress): Promise<CryptoAddress>;
  updateCryptoAddress(id: string, updates: Partial<InsertCryptoAddress>): Promise<CryptoAddress>;
  deleteCryptoAddress(id: string): Promise<void>;
  
  // Admin logs operations
  createAdminLog(log: InsertAdminLog): Promise<AdminLog>;
  getAdminLogs(adminId?: string, limit?: number): Promise<AdminLog[]>;
  
  // Admin trade management
  getAllTradesForAdmin(limit?: number, offset?: number): Promise<any[]>;
  
  // User positions
  getUserPositions(userId: string): Promise<any[]>;
  
  // Deposit request operations
  getAllDepositRequests(): Promise<DepositRequest[]>;
  getDepositRequestsByStatus(status: string): Promise<DepositRequest[]>;
  getDepositRequestById(id: string): Promise<DepositRequest | undefined>;
  updateDepositRequest(id: string, updates: Partial<DepositRequest>): Promise<DepositRequest>;
  approveDepositRequest(id: string, adminId: string, notes?: string): Promise<DepositRequest>;
  rejectDepositRequest(id: string, adminId: string, rejectionReason: string, notes?: string): Promise<DepositRequest>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: Store;

  constructor() {
    // Use a simple memory store for sessions
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
  }
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    return user;
  }

  async createUser(userData: Omit<UpsertUser, 'id'>): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Portfolio operations
  async getPortfolio(userId: string): Promise<Portfolio | undefined> {
    const [portfolio] = await db.select().from(portfolios).where(eq(portfolios.userId, userId));
    return portfolio;
  }

  // User positions for trading
  async getUserPositions(userId: string): Promise<any[]> {
    // Get active trades that represent positions
    return await db.select()
      .from(trades)
      .where(and(eq(trades.userId, userId), eq(trades.status, 'approved')))
      .orderBy(desc(trades.createdAt));
  }

  async createPortfolio(portfolio: InsertPortfolio): Promise<Portfolio> {
    const [newPortfolio] = await db.insert(portfolios).values(portfolio).returning();
    return newPortfolio;
  }

  async updatePortfolio(userId: string, updates: Partial<InsertPortfolio>): Promise<Portfolio> {
    const [updatedPortfolio] = await db
      .update(portfolios)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(portfolios.userId, userId))
      .returning();
    return updatedPortfolio;
  }

  // Algorithm operations
  async getAlgorithms(): Promise<Algorithm[]> {
    return await db.select().from(algorithms).where(eq(algorithms.active, true));
  }

  async getAlgorithm(id: string): Promise<Algorithm | undefined> {
    const [algorithm] = await db.select().from(algorithms).where(eq(algorithms.id, id));
    return algorithm;
  }

  async createAlgorithm(algorithm: InsertAlgorithm): Promise<Algorithm> {
    const [newAlgorithm] = await db.insert(algorithms).values(algorithm).returning();
    return newAlgorithm;
  }

  // Trade operations
  async getTrades(userId: string, limit: number = 50): Promise<Trade[]> {
    return await db.select()
      .from(trades)
      .where(eq(trades.userId, userId))
      .orderBy(desc(trades.createdAt))
      .limit(limit);
  }

  async createTrade(trade: InsertTrade): Promise<Trade> {
    const [newTrade] = await db.insert(trades).values(trade).returning();
    return newTrade;
  }

  async updateTrade(id: string, updates: Partial<InsertTrade>): Promise<Trade> {
    const [updatedTrade] = await db
      .update(trades)
      .set(updates)
      .where(eq(trades.id, id))
      .returning();
    return updatedTrade;
  }

  // Performance metrics operations
  async getPerformanceMetrics(userId: string, algorithmId?: string): Promise<PerformanceMetric[]> {
    let query = db.select().from(performanceMetrics).where(eq(performanceMetrics.userId, userId));
    
    if (algorithmId) {
      query = query.where(and(eq(performanceMetrics.userId, userId), eq(performanceMetrics.algorithmId, algorithmId)));
    }
    
    return await query;
  }

  async createPerformanceMetric(metric: InsertPerformanceMetric): Promise<PerformanceMetric> {
    const [newMetric] = await db.insert(performanceMetrics).values(metric).returning();
    return newMetric;
  }

  async updatePerformanceMetric(id: string, updates: Partial<InsertPerformanceMetric>): Promise<PerformanceMetric> {
    const [updatedMetric] = await db
      .update(performanceMetrics)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(performanceMetrics.id, id))
      .returning();
    return updatedMetric;
  }

  // User wallet operations
  async getUserWallets(userId: string): Promise<UserWallet[]> {
    return await db.select().from(userWallets).where(eq(userWallets.userId, userId));
  }

  async getUserWallet(userId: string, symbol: string): Promise<UserWallet | undefined> {
    const [wallet] = await db.select()
      .from(userWallets)
      .where(and(eq(userWallets.userId, userId), eq(userWallets.symbol, symbol)));
    return wallet;
  }

  async createUserWallet(wallet: InsertUserWallet): Promise<UserWallet> {
    const [newWallet] = await db.insert(userWallets).values(wallet).returning();
    return newWallet;
  }

  async updateUserWallet(id: string, updates: Partial<InsertUserWallet>): Promise<UserWallet> {
    const [updatedWallet] = await db
      .update(userWallets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userWallets.id, id))
      .returning();
    return updatedWallet;
  }

  // Stock holding operations
  async getStockHoldings(userId: string): Promise<StockHolding[]> {
    return await db.select().from(stockHoldings).where(eq(stockHoldings.userId, userId));
  }

  async getStockHolding(userId: string, symbol: string): Promise<StockHolding | undefined> {
    const [holding] = await db.select()
      .from(stockHoldings)
      .where(and(eq(stockHoldings.userId, userId), eq(stockHoldings.symbol, symbol)));
    return holding;
  }

  async createStockHolding(holding: InsertStockHolding): Promise<StockHolding> {
    const [newHolding] = await db.insert(stockHoldings).values(holding).returning();
    return newHolding;
  }

  async updateStockHolding(id: string, updates: Partial<InsertStockHolding>): Promise<StockHolding> {
    const [updatedHolding] = await db
      .update(stockHoldings)
      .set(updates)
      .where(eq(stockHoldings.id, id))
      .returning();
    return updatedHolding;
  }

  async createAlgorithm(algorithm: InsertAlgorithm): Promise<Algorithm> {
    const [newAlgorithm] = await db.insert(algorithms).values(algorithm).returning();
    return newAlgorithm;
  }

  // Trade operations
  async getTrades(userId: string, limit = 50): Promise<Trade[]> {
    return await db
      .select()
      .from(trades)
      .where(eq(trades.userId, userId))
      .orderBy(desc(trades.createdAt))
      .limit(limit);
  }

  async createTrade(trade: InsertTrade): Promise<Trade> {
    const [newTrade] = await db.insert(trades).values(trade).returning();
    return newTrade;
  }

  async updateTrade(id: string, updates: Partial<InsertTrade>): Promise<Trade> {
    const [updatedTrade] = await db
      .update(trades)
      .set(updates)
      .where(eq(trades.id, id))
      .returning();
    return updatedTrade;
  }

  // Performance metrics operations
  async getPerformanceMetrics(userId: string, algorithmId?: string): Promise<PerformanceMetric[]> {
    const conditions = [eq(performanceMetrics.userId, userId)];
    if (algorithmId) {
      conditions.push(eq(performanceMetrics.algorithmId, algorithmId));
    }
    
    return await db
      .select()
      .from(performanceMetrics)
      .where(and(...conditions))
      .orderBy(desc(performanceMetrics.updatedAt));
  }

  async createPerformanceMetric(metric: InsertPerformanceMetric): Promise<PerformanceMetric> {
    const [newMetric] = await db.insert(performanceMetrics).values(metric).returning();
    return newMetric;
  }

  async updatePerformanceMetric(id: string, updates: Partial<InsertPerformanceMetric>): Promise<PerformanceMetric> {
    const [updatedMetric] = await db
      .update(performanceMetrics)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(performanceMetrics.id, id))
      .returning();
    return updatedMetric;
  }

  // Admin operations - PRODUCTION READY
  async getAdminByEmail(email: string): Promise<AdminUser | undefined> {
    const normalizedEmail = email.toLowerCase().trim();
    const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.email, normalizedEmail));
    console.log("STORAGE: Admin lookup for", normalizedEmail, admin ? "found" : "not found");
    return admin;
  }

  async createAdmin(admin: InsertAdminUser): Promise<AdminUser> {
    const [newAdmin] = await db.insert(adminUsers).values({
      ...admin,
      email: admin.email.toLowerCase().trim()
    }).returning();
    console.log("STORAGE: Admin created", newAdmin.email);
    return newAdmin;
  }

  async updateAdminLastLogin(id: string): Promise<AdminUser> {
    const [updatedAdmin] = await db
      .update(adminUsers)
      .set({ lastLoginAt: new Date(), updatedAt: new Date() })
      .where(eq(adminUsers.id, id))
      .returning();
    console.log("STORAGE: Admin last login updated", updatedAdmin.email);
    return updatedAdmin;
  }

  // Website settings operations
  async getWebsiteSettings(category?: string): Promise<WebsiteSetting[]> {
    const query = db.select().from(websiteSettings);
    if (category) {
      return await query.where(eq(websiteSettings.category, category));
    }
    return await query;
  }

  async getWebsiteSetting(key: string): Promise<WebsiteSetting | undefined> {
    const [setting] = await db.select().from(websiteSettings).where(eq(websiteSettings.key, key));
    return setting;
  }

  async createWebsiteSetting(setting: InsertWebsiteSetting): Promise<WebsiteSetting> {
    const [newSetting] = await db.insert(websiteSettings).values(setting).returning();
    return newSetting;
  }

  async updateWebsiteSetting(key: string, updates: Partial<InsertWebsiteSetting>): Promise<WebsiteSetting> {
    const [updatedSetting] = await db
      .update(websiteSettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(websiteSettings.key, key))
      .returning();
    return updatedSetting;
  }

  // Crypto addresses operations
  async getCryptoAddresses(): Promise<CryptoAddress[]> {
    return await db.select().from(cryptoAddresses).where(eq(cryptoAddresses.isActive, true));
  }

  async getCryptoAddress(symbol: string): Promise<CryptoAddress | undefined> {
    const [address] = await db
      .select()
      .from(cryptoAddresses)
      .where(and(eq(cryptoAddresses.symbol, symbol), eq(cryptoAddresses.isActive, true)));
    return address;
  }

  async createCryptoAddress(address: InsertCryptoAddress): Promise<CryptoAddress> {
    const [newAddress] = await db.insert(cryptoAddresses).values(address).returning();
    return newAddress;
  }

  async updateCryptoAddress(id: string, updates: Partial<InsertCryptoAddress>): Promise<CryptoAddress> {
    const [updatedAddress] = await db
      .update(cryptoAddresses)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(cryptoAddresses.id, id))
      .returning();
    return updatedAddress;
  }

  async deleteCryptoAddress(id: string): Promise<void> {
    await db
      .update(cryptoAddresses)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(cryptoAddresses.id, id));
  }

  // Admin logs operations
  async createAdminLog(log: InsertAdminLog): Promise<AdminLog> {
    const [newLog] = await db.insert(adminLogs).values(log).returning();
    return newLog;
  }

  async getAdminLogs(adminId?: string, limit = 100): Promise<AdminLog[]> {
    const query = db.select().from(adminLogs);
    if (adminId) {
      return await query.where(eq(adminLogs.adminId, adminId)).orderBy(desc(adminLogs.createdAt)).limit(limit);
    }
    return await query.orderBy(desc(adminLogs.createdAt)).limit(limit);
  }

  // Admin trade management operations
  async getAllTradesForAdmin(limit = 50, offset = 0): Promise<any[]> {
    const allTrades = await db
      .select({
        id: trades.id,
        userId: trades.userId,
        symbol: trades.symbol,
        type: trades.type,
        quantity: trades.quantity,
        price: trades.price,
        totalAmount: trades.totalAmount,
        status: trades.status,
        adminApproval: trades.adminApproval,
        assetType: trades.assetType,
        executedAt: trades.executedAt,
        currentPrice: trades.currentPrice,
        currentValue: trades.currentValue,
        profitLoss: trades.profitLoss,
        profitLossPercentage: trades.profitLossPercentage,
        isOpen: trades.isOpen,
        createdAt: trades.createdAt,
        updatedAt: trades.updatedAt,
        username: users.username,
        email: users.email
      })
      .from(trades)
      .leftJoin(users, eq(trades.userId, users.id))
      .orderBy(desc(trades.createdAt))
      .limit(limit)
      .offset(offset);
    
    return allTrades;
  }
  async getUserDetails(id: string): Promise<any> {
    try {
      console.log(`[DEBUG] Getting user details for ID: ${id}`);
      
      // Get user basic info
      const user = await this.getUser(id);
      if (!user) {
        console.log(`[DEBUG] User not found for ID: ${id}`);
        return null;
      }
      console.log(`[DEBUG] User found: ${user.username}`);

      // Get portfolio
      const portfolio = await this.getPortfolio(id);
      console.log(`[DEBUG] Portfolio data:`, portfolio);

      // Get recent trades
      const userTrades = await this.getTrades(id, 10);
      console.log(`[DEBUG] User trades count: ${userTrades.length}`);

      // Get user wallets with real data
      const wallets = await this.getUserWallets(id);
      console.log(`[DEBUG] User wallets count: ${wallets.length}`);

      // Get stock holdings with real data  
      const stockHoldings = await this.getStockHoldings(id);
      console.log(`[DEBUG] User stock holdings count: ${stockHoldings.length}`);

      // Calculate total portfolio value from wallets + stocks
      const totalWalletValue = wallets.reduce((sum, wallet) => {
        return sum + parseFloat(wallet.usdValue?.toString() || '0');
      }, 0);

      const totalStockValue = stockHoldings.reduce((sum, holding) => {
        return sum + parseFloat(holding.marketValue?.toString() || '0');
      }, 0);

      const totalPortfolioValue = totalWalletValue + totalStockValue;

      const result = {
        ...user,
        portfolio: portfolio ? {
          totalBalance: portfolio.totalBalance || '0',
          buyingPower: portfolio.buyingPower || '0',
          totalProfitLoss: this.calculateTotalProfitLoss(userTrades),
          todayPL: portfolio.todayPl || '0',
          winRate: portfolio.winRate || '0',
          activeAlgorithms: portfolio.activeAlgorithms || 0,
          totalValue: totalPortfolioValue
        } : {
          totalBalance: '0',
          buyingPower: '0',
          totalProfitLoss: this.calculateTotalProfitLoss(userTrades),
          todayPL: '0',
          winRate: '0',
          activeAlgorithms: 0,
          totalValue: totalPortfolioValue
        },
        trades: userTrades,
        walletBalances: wallets,
        stockHoldings,
        totalPortfolioValue,
        totalWalletValue,
        totalStockValue
      };

      console.log(`[DEBUG] Final user details result:`, JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      console.error(`[ERROR] getUserDetails failed for ID ${id}:`, error);
      throw error;
    }
  }

  // Admin user management operations
  async getAllUsers(limit = 50, offset = 0): Promise<User[]> {
    return await db.select().from(users).limit(limit).offset(offset);
  }

  async getUserCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(users);
    return result[0].count;
  }

  async getUsersRegisteredToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(sql`${users.createdAt} >= ${today.toISOString()}`);
    return result[0].count;
  }

  async getUsersActiveToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(sql`${users.lastLoginAt} >= ${today.toISOString()}`);
    return result[0].count;
  }

  async updateUserLastLogin(id: string, ipAddress: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async updateUserLoginInfo(userId: string, ipAddress: string): Promise<void> {
    await db
      .update(users)
      .set({
        lastLoginIp: ipAddress,
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async updateUserStatus(id: string, isActive: boolean): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async adjustUserBalance(id: string, amount: number, type: 'add' | 'remove'): Promise<any> {
    const portfolio = await this.getPortfolio(id);
    if (!portfolio) {
      throw new Error('Portfolio not found');
    }
    
    const currentBalance = parseFloat(portfolio.totalBalance?.toString() || '0');
    const adjustment = type === 'add' ? amount : -amount;
    const newBalance = Math.max(0, currentBalance + adjustment);
    
    return await this.updatePortfolio(id, {
      totalBalance: newBalance.toString()
    });
  }

  async addUserProfit(userId: string, amount: number): Promise<any> {
    const portfolio = await this.getPortfolio(userId);
    if (!portfolio) {
      throw new Error('Portfolio not found');
    }
    
    const currentBalance = parseFloat(portfolio.totalBalance?.toString() || '0');
    const currentProfit = parseFloat(portfolio.totalProfitLoss?.toString() || '0');
    
    // Add profit to both balance and profit tracking
    const newBalance = currentBalance + amount;
    const newProfit = currentProfit + amount;
    
    return await this.updatePortfolio(userId, {
      totalBalance: newBalance.toString(),
      totalProfitLoss: newProfit.toString()
    });
  }

  async approveUserTrades(userId: string, tradeIds: string[]): Promise<any> {
    const updatedTrades = [];
    for (const tradeId of tradeIds) {
      const [updatedTrade] = await db
        .update(trades)
        .set({ 
          status: 'approved',
          adminApproval: 'approved',
          approvedAt: new Date()
        })
        .where(and(eq(trades.id, tradeId), eq(trades.userId, userId)))
        .returning();
      if (updatedTrade) {
        updatedTrades.push(updatedTrade);
      }
    }
    return updatedTrades;
  }

  // Helper method to calculate total profit/loss from trades
  private calculateTotalProfitLoss(trades: Trade[]): string {
    const totalPL = trades.reduce((sum, trade) => {
      return sum + parseFloat(trade.profitLoss?.toString() || '0');
    }, 0);
    return totalPL.toFixed(2);
  }

  // Real-time analytics methods
  async getTotalPlatformRevenue(): Promise<string> {
    const result = await db
      .select({ 
        total: sql<string>`COALESCE(SUM(CAST(${portfolios.totalBalance} AS DECIMAL)), 0)` 
      })
      .from(portfolios);
    return result[0].total || '0';
  }

  async getPendingTradesCount(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(trades)
      .where(eq(trades.adminApproval, 'pending'));
    return result[0].count;
  }

  async getActiveTradesCount(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(trades)
      .where(eq(trades.status, 'approved'));
    return result[0].count;
  }

  async getPendingDepositsCount(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(depositRequests)
      .where(eq(depositRequests.status, 'pending'));
    return result[0].count;
  }

  // Trade profit tracking methods
  async getTradeById(id: string): Promise<Trade | undefined> {
    const [trade] = await db.select().from(trades).where(eq(trades.id, id));
    return trade;
  }

  async closeTrade(id: string): Promise<Trade> {
    const [updatedTrade] = await db
      .update(trades)
      .set({ 
        status: 'closed',
        isOpen: false,
        executedAt: new Date()
      })
      .where(eq(trades.id, id))
      .returning();
    return updatedTrade;
  }

  async updateTradePrice(id: string, currentPrice: number): Promise<Trade> {
    const [updatedTrade] = await db
      .update(trades)
      .set({ 
        currentPrice: currentPrice.toString(),
        updatedAt: new Date()
      })
      .where(eq(trades.id, id))
      .returning();
    return updatedTrade;
  }

  async updatePortfolioBalance(userId: string, amount: number): Promise<Portfolio> {
    const portfolio = await this.getPortfolio(userId);
    if (!portfolio) {
      throw new Error('Portfolio not found');
    }
    
    const currentBalance = parseFloat(portfolio.totalBalance?.toString() || '0');
    const newBalance = currentBalance + amount;
    
    return await this.updatePortfolio(userId, {
      totalBalance: newBalance.toString()
    });
  }

  async updateTradeApproval(id: string, status: 'approved' | 'rejected'): Promise<Trade> {
    const [updatedTrade] = await db
      .update(trades)
      .set({ 
        adminApproval: status,
        status: status === 'approved' ? 'approved' : 'rejected',
        updatedAt: new Date()
      })
      .where(eq(trades.id, id))
      .returning();
    return updatedTrade;
  }

  async updateUserStatus(userId: string, isActive: boolean): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ 
        isActive,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  // Deposit request management implementations
  async getAllDepositRequests(): Promise<DepositRequest[]> {
    return await db.select().from(depositRequests).orderBy(desc(depositRequests.createdAt));
  }

  async getDepositRequestsByStatus(status: string): Promise<DepositRequest[]> {
    return await db.select().from(depositRequests)
      .where(eq(depositRequests.status, status))
      .orderBy(desc(depositRequests.createdAt));
  }

  async getDepositRequestById(id: string): Promise<DepositRequest | undefined> {
    const [depositRequest] = await db.select().from(depositRequests).where(eq(depositRequests.id, id));
    return depositRequest;
  }

  async updateDepositRequest(id: string, updates: Partial<DepositRequest>): Promise<DepositRequest> {
    const [updatedRequest] = await db
      .update(depositRequests)
      .set({ 
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(depositRequests.id, id))
      .returning();
    return updatedRequest;
  }

  async approveDepositRequest(id: string, adminId: string, notes?: string): Promise<DepositRequest> {
    return await this.updateDepositRequest(id, {
      status: 'approved',
      adminApproval: 'approved',
      approvedBy: adminId,
      approvedAt: new Date(),
      notes
    });
  }

  async rejectDepositRequest(id: string, adminId: string, rejectionReason: string, notes?: string): Promise<DepositRequest> {
    return await this.updateDepositRequest(id, {
      status: 'rejected',
      adminApproval: 'rejected',
      approvedBy: adminId,
      approvedAt: new Date(),
      rejectionReason,
      notes
    });
  }
}

export const storage = new DatabaseStorage();
