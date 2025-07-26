import {
  users,
  portfolios,
  trades,
  algorithms,
  performanceMetrics,
  adminUsers,
  websiteSettings,
  cryptoAddresses,
  adminLogs,
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
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Omit<UpsertUser, 'id'>): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  
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

  // Admin operations
  async getAdminByEmail(email: string): Promise<AdminUser | undefined> {
    const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.email, email.toLowerCase()));
    return admin;
  }

  async createAdmin(admin: InsertAdminUser): Promise<AdminUser> {
    const [newAdmin] = await db.insert(adminUsers).values(admin).returning();
    return newAdmin;
  }

  async updateAdminLastLogin(id: string): Promise<AdminUser> {
    const [updatedAdmin] = await db
      .update(adminUsers)
      .set({ lastLoginAt: new Date(), updatedAt: new Date() })
      .where(eq(adminUsers.id, id))
      .returning();
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
}

export const storage = new DatabaseStorage();
