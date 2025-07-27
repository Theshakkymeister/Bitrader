import {
  users,
  portfolios,
  algorithms,
  trades,
  performanceMetrics,
  userWallets,
  stockHoldings,
  adminUsers,
  websiteSettings,
  cryptoAddresses,
  adminLogs,
  type User,
  type UpsertUser,
  type Portfolio,
  type InsertPortfolio,
  type Algorithm,
  type InsertAlgorithm,
  type Trade,
  type InsertTrade,
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
  depositRequests,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import session from "express-session";
import type { SessionOptions, Store } from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresStore = connectPg(session);

// Interface for all storage operations
export interface IStorage {
  // Session store
  sessionStore: Store;
  
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(userData: Omit<UpsertUser, 'id'>): Promise<User>;
  upsertUser(userData: UpsertUser): Promise<User>;
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
  approveUserTrades(userId: string, tradeIds: string[]): Promise<any>;
  
  // Real-time analytics methods
  getTotalPlatformRevenue(): Promise<string>;
  getPendingTradesCount(): Promise<number>;
  getActiveTradesCount(): Promise<number>;
  getPendingDepositsCount(): Promise<number>;
  
  // Trade profit tracking methods
  getTradeById(id: string): Promise<Trade | undefined>;
  closeTrade(id: string): Promise<Trade>;
  updateTradePrice(id: string, currentPrice: number): Promise<Trade>;
  updatePortfolioBalance(userId: string, amount: number): Promise<Portfolio>;
  
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
  getUserPositions(userId: string): Promise<Trade[]>;
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
  logAdminActivity(adminId: string, action: string, resource: string, resourceId: string | null, details: any, request: any): Promise<void>;

  // Deposit requests
  getUserDepositRequests(userId: string): Promise<any[]>;
  createDepositRequest(request: any): Promise<any>;
  updateDepositRequest(id: string, updates: any): Promise<any>;
  getDepositRequestsByStatus(status: string): Promise<any[]>;
  getAllDepositRequests(): Promise<any[]>;
}


export class DatabaseStorage implements IStorage {
  sessionStore: Store;
  
  constructor() {
    this.sessionStore = new PostgresStore({
      pool,
      createTableIfMissing: false, // Prevent duplicate table creation
      tableName: "sessions", // Use correct table name from schema
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

  // Portfolio operations
  async getPortfolio(userId: string): Promise<Portfolio | undefined> {
    const [portfolio] = await db.select().from(portfolios).where(eq(portfolios.userId, userId));
    return portfolio;
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
  async getTrades(userId: string, limit = 50): Promise<Trade[]> {
    return await db
      .select()
      .from(trades)
      .where(eq(trades.userId, userId))
      .orderBy(desc(trades.createdAt))
      .limit(limit);
  }

  async getUserPositions(userId: string): Promise<Trade[]> {
    return await db.select({
      id: trades.id,
      userId: trades.userId,
      symbol: trades.symbol,
      assetType: trades.assetType,
      type: trades.type,
      quantity: trades.quantity,
      price: trades.price,
      totalAmount: trades.totalAmount,
      profitLoss: trades.profitLoss,
      status: trades.status,
      executedAt: trades.executedAt,
      createdAt: trades.createdAt,
      updatedAt: trades.updatedAt
    })
      .from(trades)
      .where(and(
        eq(trades.userId, userId),
        eq(trades.status, 'executed')
      ))
      .orderBy(desc(trades.createdAt));
  }

  async getTradeById(id: string): Promise<Trade | undefined> {
    const [trade] = await db.select().from(trades).where(eq(trades.id, id));
    return trade;
  }

  async createTrade(trade: InsertTrade): Promise<Trade> {
    console.log("STORAGE: Creating trade with data:", trade);
    const [newTrade] = await db.insert(trades).values(trade).returning();
    console.log("STORAGE: Trade created successfully:", newTrade);
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

  async closeTrade(id: string): Promise<Trade> {
    const [closedTrade] = await db
      .update(trades)
      .set({
        isOpen: false,
        status: 'closed',
        closedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(trades.id, id))
      .returning();
    return closedTrade;
  }

  async updateTradePrice(id: string, currentPrice: number): Promise<Trade> {
    // Get the trade first to calculate P&L
    const trade = await this.getTradeById(id);
    if (!trade) {
      throw new Error('Trade not found');
    }

    const entryPrice = parseFloat(trade.price.toString());
    const quantity = parseFloat(trade.quantity.toString());
    const currentValue = currentPrice * quantity;
    
    // Calculate profit/loss based on buy/sell type
    let profitLoss = 0;
    if (trade.type === 'buy') {
      profitLoss = (currentPrice - entryPrice) * quantity;
    } else {
      profitLoss = (entryPrice - currentPrice) * quantity;
    }
    
    const profitLossPercentage = entryPrice > 0 ? (profitLoss / (entryPrice * quantity)) * 100 : 0;

    const [updatedTrade] = await db
      .update(trades)
      .set({
        currentPrice: currentPrice.toString(),
        currentValue: currentValue.toString(),
        profitLoss: profitLoss.toString(),
        profitLossPercentage: profitLossPercentage.toString(),
        updatedAt: new Date()
      })
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
    if (category) {
      return await db.select().from(websiteSettings).where(eq(websiteSettings.category, category));
    }
    return await db.select().from(websiteSettings);
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
    return await db.select().from(cryptoAddresses);
  }

  async getCryptoAddress(symbol: string): Promise<CryptoAddress | undefined> {
    const [address] = await db.select().from(cryptoAddresses).where(eq(cryptoAddresses.symbol, symbol));
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
    await db.delete(cryptoAddresses).where(eq(cryptoAddresses.id, id));
  }

  // Admin logs operations
  async createAdminLog(log: InsertAdminLog): Promise<AdminLog> {
    const [newLog] = await db.insert(adminLogs).values(log).returning();
    return newLog;
  }

  async getAdminLogs(adminId?: string, limit = 100): Promise<AdminLog[]> {
    if (adminId) {
      return await db.select().from(adminLogs)
        .where(eq(adminLogs.adminId, adminId))
        .orderBy(desc(adminLogs.createdAt))
        .limit(limit);
    }
    
    return await db.select().from(adminLogs)
      .orderBy(desc(adminLogs.createdAt))
      .limit(limit);
  }

  // User management methods for admin
  async getUserDetails(id: string): Promise<any> {
    // Get user info
    const user = await this.getUser(id);
    if (!user) return null;

    // Get portfolio info
    const portfolio = await this.getPortfolio(id);
    
    // Get trades
    const userTrades = await this.getTrades(id);
    
    // Get wallet balances
    const walletBalances = await this.getUserWallets(id);
    
    return {
      ...user,
      portfolio,
      trades: userTrades,
      walletBalances
    };
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
    // Get user's portfolio
    const portfolio = await this.getPortfolio(id);
    if (!portfolio) {
      // Create portfolio if it doesn't exist
      await this.createPortfolio({
        userId: id,
        totalBalance: type === 'add' ? amount.toString() : '0',
        todayPL: '0',
        winRate: '0',
        activeAlgorithms: 0
      });
      return { success: true, newBalance: type === 'add' ? amount : 0 };
    }

    const adjustment = type === 'add' ? amount : -amount;
    const currentBalance = parseFloat(portfolio.totalBalance || '0');
    const newBalance = Math.max(0, currentBalance + adjustment);
    
    const updatedPortfolio = await this.updatePortfolio(id, {
      totalBalance: newBalance.toString()
    });

    return { success: true, newBalance: parseFloat(updatedPortfolio.totalBalance || '0') };
  }

  async approveUserTrades(userId: string, tradeIds: string[]): Promise<any> {
    const approvedTrades = [];
    
    for (const tradeId of tradeIds) {
      const [updatedTrade] = await db
        .update(trades)
        .set({ 
          adminApproval: 'approved',
          status: 'executed',
          updatedAt: new Date()
        })
        .where(and(eq(trades.id, tradeId), eq(trades.userId, userId)))
        .returning();
      
      if (updatedTrade) {
        approvedTrades.push(updatedTrade);
      }
    }

    return { approvedCount: approvedTrades.length, trades: approvedTrades };
  }

  // Trading methods
  async createTrade(trade: any): Promise<any> {
    const [newTrade] = await db.insert(trades).values(trade).returning();
    return newTrade;
  }

  async getTrades(userId: string, limit?: number): Promise<any[]> {
    const selectQuery = db.select({
      id: trades.id,
      userId: trades.userId,
      symbol: trades.symbol,
      type: trades.type,
      orderType: trades.orderType,
      quantity: trades.quantity,
      price: trades.price,
      totalAmount: trades.totalAmount,
      status: trades.status,
      adminApproval: trades.adminApproval,
      createdAt: trades.createdAt,
      updatedAt: trades.updatedAt,
      entryPrice: trades.entryPrice,
      exitPrice: trades.exitPrice,
      profitLoss: trades.profitLoss,
      assetType: trades.assetType,
      pair: trades.pair
    })
    .from(trades)
    .where(eq(trades.userId, userId))
    .orderBy(desc(trades.createdAt));
    
    if (limit) {
      selectQuery.limit(limit);
    }
    
    const userTrades = await selectQuery;
    return userTrades;
  }

  async updateTrade(id: string, updates: any): Promise<any> {
    const [updated] = await db.update(trades)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(trades.id, id))
      .returning();
    return updated;
  }

  async getAllTradesPendingApproval(): Promise<any[]> {
    const pendingTrades = await db.select()
      .from(trades)
      .where(eq(trades.adminApproval, "pending"))
      .orderBy(desc(trades.createdAt));
    return pendingTrades;
  }

  async getTotalPlatformRevenue(): Promise<string> {
    const result = await db.select({
      totalRevenue: sql<string>`COALESCE(SUM(CAST(${portfolios.totalBalance} AS DECIMAL)), 0)`
    }).from(portfolios);
    
    const revenue = parseFloat(result[0]?.totalRevenue || '0');
    return `$${(revenue / 1000).toFixed(1)}K`;
  }

  async getActiveTradesCount(): Promise<number> {
    const result = await db.select({
      count: sql<string>`COUNT(*)`
    }).from(trades)
    .where(eq(trades.status, "executed"));
    
    return parseInt(result[0]?.count || '0');
  }

  async getPendingDepositsCount(): Promise<number> {
    const result = await db.select({
      count: sql<string>`COUNT(*)`
    }).from(portfolios)
    .where(sql`CAST(${portfolios.totalBalance} AS DECIMAL) = 0`);
    
    return parseInt(result[0]?.count || '0');
  }

  // Admin user management operations
  async getAllUsers(limit = 50, offset = 0): Promise<User[]> {
    return await db.select().from(users)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getUserCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(users);
    return result[0]?.count || 0;
  }

  async getUsersRegisteredToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(sql`${users.createdAt} >= ${today}`);
    return result[0]?.count || 0;
  }

  async getUsersActiveToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(sql`${users.lastLoginAt} >= ${today}`);
    return result[0]?.count || 0;
  }

  async updateUserLastLogin(id: string, ipAddress: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ 
        lastLoginAt: new Date(), 
        lastLoginIp: ipAddress,
        updatedAt: new Date() 
      })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async getActiveTradesCount(): Promise<number> {
    try {
      const result = await db.select({ 
        count: sql<number>`count(*)` 
      }).from(trades).where(eq(trades.status, 'executed'));
      
      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error getting active trades count:', error);
      return 0;
    }
  }

  async getPendingDepositsCount(): Promise<number> {
    try {
      // Count pending deposit requests
      const result = await db.select({ 
        count: sql<number>`count(*)` 
      }).from(depositRequests).where(eq(depositRequests.status, 'pending'));
      
      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error getting pending deposits count:', error);
      return 0;
    }
  }

  // Deposit request operations
  async getUserDepositRequests(userId: string): Promise<DepositRequest[]> {
    return await db.select().from(depositRequests)
      .where(eq(depositRequests.userId, userId))
      .orderBy(desc(depositRequests.createdAt));
  }

  async createDepositRequest(request: InsertDepositRequest): Promise<DepositRequest> {
    const [depositRequest] = await db.insert(depositRequests)
      .values(request)
      .returning();
    return depositRequest;
  }

  async updateDepositRequest(id: string, updates: Partial<InsertDepositRequest>): Promise<DepositRequest> {
    const [updated] = await db.update(depositRequests)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(depositRequests.id, id))
      .returning();
    return updated;
  }

  async getDepositRequestsByStatus(status: string): Promise<DepositRequest[]> {
    return await db.select().from(depositRequests)
      .where(eq(depositRequests.status, status))
      .orderBy(desc(depositRequests.createdAt));
  }

  async getAllDepositRequests(): Promise<DepositRequest[]> {
    return await db.select().from(depositRequests)
      .orderBy(desc(depositRequests.createdAt));
  }

  async getDepositRequestById(id: string): Promise<DepositRequest | undefined> {
    const [request] = await db.select().from(depositRequests)
      .where(eq(depositRequests.id, id));
    return request;
  }

  // Enhanced getUserDetails with real-time data
  async getUserDetails(id: string): Promise<any> {
    try {
      // Get user basic info
      const user = await this.getUser(id);
      if (!user) return null;

      // Get portfolio
      const portfolio = await this.getPortfolio(id);

      // Get recent trades with proper type handling - avoiding current_price column
      const userTrades = await db.select({
        id: trades.id,
        symbol: trades.symbol,
        quantity: trades.quantity,
        price: trades.price,
        type: trades.type,
        status: trades.status,
        totalAmount: trades.totalAmount,
        profitLoss: trades.profitLoss,
        createdAt: trades.createdAt
      }).from(trades)
        .where(eq(trades.userId, id))
        .orderBy(desc(trades.createdAt))
        .limit(10);

      // Get user wallets
      const wallets = await this.getUserWallets(id);

      // Get stock holdings
      const stockHoldings = await this.getStockHoldings(id);

      // Get deposit requests
      const depositRequests = await this.getUserDepositRequests(id);

      // Calculate real-time metrics
      const totalTrades = userTrades.length;
      const profitableTrades = userTrades.filter(trade => {
        const profit = trade.profitLoss ? parseFloat(trade.profitLoss.toString()) : 0;
        return profit > 0;
      }).length;

      const totalProfitLoss = userTrades.reduce((sum, trade) => {
        const profit = trade.profitLoss ? parseFloat(trade.profitLoss.toString()) : 0;
        return sum + profit;
      }, 0);

      return {
        user: {
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
        },
        portfolio: portfolio ? {
          totalBalance: parseFloat(portfolio.totalBalance?.toString() || '0'),
          totalProfitLoss: parseFloat(portfolio.totalProfitLoss?.toString() || '0'),
          availableBalance: parseFloat(portfolio.availableBalance?.toString() || '0'),
          marginUsed: parseFloat(portfolio.marginUsed?.toString() || '0'),
          // Calculate real-time total value from wallets + stock holdings
          totalValue: wallets.reduce((sum, wallet) => {
            return sum + parseFloat(wallet.usdValue?.toString() || '0');
          }, 0) + stockHoldings.reduce((sum, holding) => {
            return sum + parseFloat(holding.marketValue?.toString() || '0');
          }, 0),
          // Calculate buying power from total wallet value (same as dashboard)
          buyingPower: wallets.reduce((sum, wallet) => {
            return sum + parseFloat(wallet.usdValue?.toString() || '0');
          }, 0)
        } : {
          totalBalance: 0,
          totalProfitLoss: 0,
          availableBalance: 0,
          marginUsed: 0,
          totalValue: wallets.reduce((sum, wallet) => {
            return sum + parseFloat(wallet.usdValue?.toString() || '0');
          }, 0) + stockHoldings.reduce((sum, holding) => {
            return sum + parseFloat(holding.marketValue?.toString() || '0');
          }, 0),
          // Calculate buying power from total wallet value (same as dashboard)
          buyingPower: wallets.reduce((sum, wallet) => {
            return sum + parseFloat(wallet.usdValue?.toString() || '0');
          }, 0)
        },
        trades: userTrades.map(trade => ({
          ...trade,
          price: trade.price ? parseFloat(trade.price.toString()) : 0,
          totalAmount: trade.totalAmount ? parseFloat(trade.totalAmount.toString()) : 0,
          quantity: trade.quantity ? parseFloat(trade.quantity.toString()) : 0,
          profitLoss: trade.profitLoss ? parseFloat(trade.profitLoss.toString()) : 0
        })),
        wallets: wallets.map(wallet => ({
          ...wallet,
          balance: parseFloat(wallet.balance?.toString() || '0'),
          usdValue: parseFloat(wallet.usdValue?.toString() || '0')
        })),
        stockHoldings: stockHoldings.map(holding => ({
          ...holding,
          shares: parseFloat(holding.shares?.toString() || '0'),
          avgCostBasis: parseFloat(holding.avgCostBasis?.toString() || '0'),
          currentPrice: parseFloat(holding.currentPrice?.toString() || '0'),
          marketValue: parseFloat(holding.marketValue?.toString() || '0'),
          totalReturn: parseFloat(holding.totalReturn?.toString() || '0'),
          returnPercentage: parseFloat(holding.returnPercentage?.toString() || '0')
        })),
        depositRequests: depositRequests.map(request => ({
          ...request,
          amount: parseFloat(request.amount?.toString() || '0'),
          usdValue: parseFloat(request.usdValue?.toString() || '0')
        })),
        // Add wallet balances for portfolio display
        walletBalances: wallets.map(wallet => ({
          currency: wallet.currency,
          balance: parseFloat(wallet.balance?.toString() || '0'),
          usdValue: parseFloat(wallet.usdValue?.toString() || '0')
        })),
        analytics: {
          totalTrades,
          profitableTrades,
          winRate: totalTrades > 0 ? ((profitableTrades / totalTrades) * 100).toFixed(2) : '0.00',
          totalProfitLoss: totalProfitLoss.toFixed(2),
          avgTradeSize: userTrades.length > 0 ? 
            (userTrades.reduce((sum, trade) => sum + parseFloat(trade.totalAmount?.toString() || '0'), 0) / userTrades.length).toFixed(2) : '0.00'
        }
      };
    } catch (error) {
      console.error('Error fetching enhanced user details:', error);
      throw error;
    }
  }

  // Admin logging activity
  async logAdminActivity(adminId: string, action: string, resource: string, resourceId: string | null, details: any, request: any): Promise<void> {
    try {
      await this.createAdminLog({
        adminId,
        action,
        resource,
        resourceId,
        details,
        ipAddress: request.ip || request.connection?.remoteAddress || 'unknown',
        userAgent: request.get('User-Agent') || 'unknown'
      });
    } catch (error) {
      console.error('Error logging admin activity:', error);
      // Don't throw error to prevent disrupting main operation
    }
  }
}

export const storage = new DatabaseStorage();