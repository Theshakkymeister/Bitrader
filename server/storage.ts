import {
  users,
  portfolios,
  trades,
  algorithms,
  performanceMetrics,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
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
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
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
}

export const storage = new DatabaseStorage();
