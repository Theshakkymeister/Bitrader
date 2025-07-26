import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  decimal,
  integer,
  text,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  // External website integration fields
  externalUserId: varchar("external_user_id").unique(), // User ID from your main website
  apiKey: varchar("api_key"), // API key for accessing your website's data
  lastSyncAt: timestamp("last_sync_at"), // Last time data was synced from external API
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Trading algorithms
export const algorithms = pgTable("algorithms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  type: varchar("type").notNull(), // 'forex', 'gold', 'stocks', 'crypto'
  description: text("description"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// User portfolios
export const portfolios = pgTable("portfolios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  totalBalance: decimal("total_balance", { precision: 15, scale: 2 }).default('0'),
  todayPL: decimal("today_pl", { precision: 15, scale: 2 }).default('0'),
  winRate: decimal("win_rate", { precision: 5, scale: 2 }).default('0'),
  activeAlgorithms: integer("active_algorithms").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Trading history
export const trades = pgTable("trades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  algorithmId: varchar("algorithm_id").references(() => algorithms.id).notNull(),
  pair: varchar("pair").notNull(),
  type: varchar("type").notNull(), // 'BUY' or 'SELL'
  entryPrice: decimal("entry_price", { precision: 15, scale: 5 }).notNull(),
  exitPrice: decimal("exit_price", { precision: 15, scale: 5 }),
  profitLoss: decimal("profit_loss", { precision: 15, scale: 2 }),
  volume: decimal("volume", { precision: 15, scale: 5 }), // Trade size/volume
  duration: integer("duration"), // Trade duration in minutes
  status: varchar("status").notNull().default('open'), // 'open', 'closed'
  // External integration fields
  externalTradeId: varchar("external_trade_id").unique(), // Trade ID from your website
  createdAt: timestamp("created_at").defaultNow(),
  closedAt: timestamp("closed_at"),
});

// Performance metrics
export const performanceMetrics = pgTable("performance_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  algorithmId: varchar("algorithm_id").references(() => algorithms.id).notNull(),
  sharpeRatio: decimal("sharpe_ratio", { precision: 5, scale: 2 }),
  maxDrawdown: decimal("max_drawdown", { precision: 5, scale: 2 }),
  avgTradeDuration: decimal("avg_trade_duration", { precision: 10, scale: 2 }), // in hours
  profitFactor: decimal("profit_factor", { precision: 5, scale: 2 }),
  totalTrades: integer("total_trades").default(0),
  winningTrades: integer("winning_trades").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admin users table
export const adminUsers = pgTable("admin_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  passwordHash: varchar("password_hash").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  role: varchar("role").notNull().default('admin'), // 'admin', 'super_admin'
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Website settings that admin can control
export const websiteSettings = pgTable("website_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key").unique().notNull(),
  value: text("value"),
  description: text("description"),
  category: varchar("category").notNull(), // 'general', 'trading', 'wallets', 'ui'
  updatedBy: varchar("updated_by").references(() => adminUsers.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Crypto deposit addresses that admin can manage
export const cryptoAddresses = pgTable("crypto_addresses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  symbol: varchar("symbol").notNull(), // 'BTC', 'ETH', 'SOL', etc.
  name: varchar("name").notNull(), // Full name like 'Bitcoin', 'Ethereum'
  address: varchar("address").notNull(),
  network: varchar("network"), // 'mainnet', 'testnet', etc.
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").references(() => adminUsers.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admin activity logs
export const adminLogs = pgTable("admin_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: varchar("admin_id").references(() => adminUsers.id).notNull(),
  action: varchar("action").notNull(), // 'CREATE', 'UPDATE', 'DELETE', 'LOGIN'
  resource: varchar("resource").notNull(), // 'USER', 'ALGORITHM', 'SETTINGS', etc.
  resourceId: varchar("resource_id"),
  details: jsonb("details"), // Additional context about the action
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const userRelations = relations(users, ({ one, many }) => ({
  portfolio: one(portfolios),
  trades: many(trades),
  performanceMetrics: many(performanceMetrics),
}));

export const algorithmRelations = relations(algorithms, ({ many }) => ({
  trades: many(trades),
  performanceMetrics: many(performanceMetrics),
}));

export const portfolioRelations = relations(portfolios, ({ one }) => ({
  user: one(users, { fields: [portfolios.userId], references: [users.id] }),
}));

export const tradeRelations = relations(trades, ({ one }) => ({
  user: one(users, { fields: [trades.userId], references: [users.id] }),
  algorithm: one(algorithms, { fields: [trades.algorithmId], references: [algorithms.id] }),
}));

export const performanceMetricRelations = relations(performanceMetrics, ({ one }) => ({
  user: one(users, { fields: [performanceMetrics.userId], references: [users.id] }),
  algorithm: one(algorithms, { fields: [performanceMetrics.algorithmId], references: [algorithms.id] }),
}));

export const adminUserRelations = relations(adminUsers, ({ many }) => ({
  websiteSettings: many(websiteSettings),
  cryptoAddresses: many(cryptoAddresses),
  adminLogs: many(adminLogs),
}));

export const websiteSettingRelations = relations(websiteSettings, ({ one }) => ({
  updatedBy: one(adminUsers, { fields: [websiteSettings.updatedBy], references: [adminUsers.id] }),
}));

export const cryptoAddressRelations = relations(cryptoAddresses, ({ one }) => ({
  createdBy: one(adminUsers, { fields: [cryptoAddresses.createdBy], references: [adminUsers.id] }),
}));

export const adminLogRelations = relations(adminLogs, ({ one }) => ({
  admin: one(adminUsers, { fields: [adminLogs.adminId], references: [adminUsers.id] }),
}));

// Schema types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertAlgorithm = typeof algorithms.$inferInsert;
export type Algorithm = typeof algorithms.$inferSelect;

export type InsertPortfolio = typeof portfolios.$inferInsert;
export type Portfolio = typeof portfolios.$inferSelect;

export type InsertTrade = typeof trades.$inferInsert;
export type Trade = typeof trades.$inferSelect;

export type InsertPerformanceMetric = typeof performanceMetrics.$inferInsert;
export type PerformanceMetric = typeof performanceMetrics.$inferSelect;

export type InsertAdminUser = typeof adminUsers.$inferInsert;
export type AdminUser = typeof adminUsers.$inferSelect;

export type InsertWebsiteSetting = typeof websiteSettings.$inferInsert;
export type WebsiteSetting = typeof websiteSettings.$inferSelect;

export type InsertCryptoAddress = typeof cryptoAddresses.$inferInsert;
export type CryptoAddress = typeof cryptoAddresses.$inferSelect;

export type InsertAdminLog = typeof adminLogs.$inferInsert;
export type AdminLog = typeof adminLogs.$inferSelect;

// Zod schemas
export const insertAlgorithmSchema = createInsertSchema(algorithms).omit({
  id: true,
  createdAt: true,
});

export const insertPortfolioSchema = createInsertSchema(portfolios).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTradeSchema = createInsertSchema(trades).omit({
  id: true,
  createdAt: true,
  closedAt: true,
});

export const insertPerformanceMetricSchema = createInsertSchema(performanceMetrics).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
});

export const insertWebsiteSettingSchema = createInsertSchema(websiteSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCryptoAddressSchema = createInsertSchema(cryptoAddresses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAdminLogSchema = createInsertSchema(adminLogs).omit({
  id: true,
  createdAt: true,
});
