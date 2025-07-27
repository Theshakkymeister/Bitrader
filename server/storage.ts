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

  async getTrades(userId: string): Promise<any[]> {
    const userTrades = await db.select()
      .from(trades)
      .where(eq(trades.userId, userId))
      .orderBy(desc(trades.createdAt));
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
}

export const storage = new DatabaseStorage();