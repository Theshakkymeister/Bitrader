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

// Session storage table (required for authentication)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").unique().notNull(),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  // External website integration fields
  externalUserId: varchar("external_user_id").unique(), // User ID from your main website
  apiKey: varchar("api_key"), // API key for accessing your website's data
  lastSyncAt: timestamp("last_sync_at"), // Last time data was synced from external API
  // Registration tracking fields
  registrationIp: varchar("registration_ip"), // IP address when user registered
  lastLoginIp: varchar("last_login_ip"), // IP address on last login
  lastLoginAt: timestamp("last_login_at"), // Last login timestamp
  isActive: boolean("is_active").default(true), // Account status
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

// Live trading system with admin approval
export const trades = pgTable("trades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  algorithmId: varchar("algorithm_id").references(() => algorithms.id), // nullable
  symbol: varchar("symbol").notNull(), // AAPL, BTC, SPY, etc.
  assetType: varchar("asset_type").notNull().default("stock"), // "stock" | "crypto" | "etf" | "option"
  type: varchar("type").notNull(), // "buy" | "sell"
  orderType: varchar("order_type").notNull().default("market"), // "market" | "limit" | "stop"
  quantity: decimal("quantity", { precision: 18, scale: 8 }).notNull(),
  price: decimal("price", { precision: 18, scale: 8 }).notNull(), // Current/Market price
  limitPrice: decimal("limit_price", { precision: 18, scale: 8 }), // For limit orders
  stopPrice: decimal("stop_price", { precision: 18, scale: 8 }), // For stop orders
  totalAmount: decimal("total_amount", { precision: 18, scale: 8 }).notNull(),
  status: varchar("status").notNull().default("pending_approval"), // "pending_approval" | "approved" | "rejected" | "executed" | "cancelled"
  adminApproval: varchar("admin_approval").default("pending"), // "pending" | "approved" | "rejected"
  approvedBy: varchar("approved_by").references(() => adminUsers.id),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  executedAt: timestamp("executed_at"),
  expiresAt: timestamp("expires_at"), // For limit orders
  // Legacy fields for compatibility - all nullable
  pair: varchar("pair"), // For backward compatibility
  entryPrice: decimal("entry_price", { precision: 15, scale: 5 }), // nullable
  exitPrice: decimal("exit_price", { precision: 15, scale: 5 }), // nullable
  profitLoss: decimal("profit_loss", { precision: 15, scale: 2 }), // nullable
  volume: decimal("volume", { precision: 15, scale: 5 }), // nullable
  duration: integer("duration"),
  externalTradeId: varchar("external_trade_id").unique(),
  closedAt: timestamp("closed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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

// User crypto wallets - individual user wallet addresses and balances
export const userWallets = pgTable("user_wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  symbol: varchar("symbol").notNull(), // BTC, ETH, SOL, USDT, USDC
  name: varchar("name").notNull(), // Bitcoin, Ethereum, etc.
  balance: decimal("balance", { precision: 18, scale: 8 }).default('0'),
  usdValue: decimal("usd_value", { precision: 15, scale: 2 }).default('0'),
  walletAddress: varchar("wallet_address"), // User's external wallet address
  isConnected: boolean("is_connected").default(false),
  walletType: varchar("wallet_type"), // 'trust_wallet', 'coinbase', 'metamask'
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User stock holdings
export const stockHoldings = pgTable("stock_holdings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  symbol: varchar("symbol").notNull(), // AAPL, TSLA, GOOGL, MSFT
  name: varchar("name").notNull(), // Apple Inc., Tesla Inc.
  shares: decimal("shares", { precision: 15, scale: 6 }).default('0'),
  avgCostBasis: decimal("avg_cost_basis", { precision: 15, scale: 4 }).default('0'),
  currentPrice: decimal("current_price", { precision: 15, scale: 4 }).default('0'),
  marketValue: decimal("market_value", { precision: 15, scale: 2 }).default('0'),
  totalReturn: decimal("total_return", { precision: 15, scale: 2 }).default('0'),
  returnPercentage: decimal("return_percentage", { precision: 5, scale: 2 }).default('0'),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
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

// Crypto addresses for deposits that admin manages
export const cryptoAddresses = pgTable("crypto_addresses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  symbol: varchar("symbol").notNull(), // BTC, ETH, SOL, etc.
  name: varchar("name").notNull(), // Bitcoin, Ethereum, Solana
  address: varchar("address").notNull(),
  network: varchar("network").notNull(), // mainnet, ethereum, solana
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").references(() => adminUsers.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admin activity logs
export const adminLogs = pgTable("admin_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: varchar("admin_id").references(() => adminUsers.id).notNull(),
  action: varchar("action").notNull(), // CREATE, UPDATE, DELETE, LOGIN, LOGOUT
  resource: varchar("resource").notNull(), // CRYPTO_ADDRESS, WEBSITE_SETTING, USER
  resourceId: varchar("resource_id"),
  details: jsonb("details"),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  portfolio: one(portfolios, { fields: [users.id], references: [portfolios.userId] }),
  trades: many(trades),
  wallets: many(userWallets),
  stockHoldings: many(stockHoldings),
  performanceMetrics: many(performanceMetrics),
}));

export const portfoliosRelations = relations(portfolios, ({ one }) => ({
  user: one(users, { fields: [portfolios.userId], references: [users.id] }),
}));

export const tradesRelations = relations(trades, ({ one }) => ({
  user: one(users, { fields: [trades.userId], references: [users.id] }),
  algorithm: one(algorithms, { fields: [trades.algorithmId], references: [algorithms.id] }),
}));

export const userWalletsRelations = relations(userWallets, ({ one }) => ({
  user: one(users, { fields: [userWallets.userId], references: [users.id] }),
}));

export const stockHoldingsRelations = relations(stockHoldings, ({ one }) => ({
  user: one(users, { fields: [stockHoldings.userId], references: [users.id] }),
}));

export const algorithmRelations = relations(algorithms, ({ many }) => ({
  trades: many(trades),
  performanceMetrics: many(performanceMetrics),
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

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const insertPortfolioSchema = createInsertSchema(portfolios);
export const insertTradeSchema = createInsertSchema(trades);
export const insertAlgorithmSchema = createInsertSchema(algorithms);
export const insertPerformanceMetricSchema = createInsertSchema(performanceMetrics);
export const insertUserWalletSchema = createInsertSchema(userWallets);
export const insertStockHoldingSchema = createInsertSchema(stockHoldings);
export const insertAdminUserSchema = createInsertSchema(adminUsers);
export const insertWebsiteSettingSchema = createInsertSchema(websiteSettings);
export const insertCryptoAddressSchema = createInsertSchema(cryptoAddresses);
export const insertAdminLogSchema = createInsertSchema(adminLogs);

// TypeScript types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Portfolio = typeof portfolios.$inferSelect;
export type InsertPortfolio = z.infer<typeof insertPortfolioSchema>;

export type Trade = typeof trades.$inferSelect;
export type InsertTrade = z.infer<typeof insertTradeSchema>;

export type Algorithm = typeof algorithms.$inferSelect;
export type InsertAlgorithm = z.infer<typeof insertAlgorithmSchema>;

export type PerformanceMetric = typeof performanceMetrics.$inferSelect;
export type InsertPerformanceMetric = z.infer<typeof insertPerformanceMetricSchema>;

export type UserWallet = typeof userWallets.$inferSelect;
export type InsertUserWallet = z.infer<typeof insertUserWalletSchema>;

export type StockHolding = typeof stockHoldings.$inferSelect;
export type InsertStockHolding = z.infer<typeof insertStockHoldingSchema>;

export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;

export type WebsiteSetting = typeof websiteSettings.$inferSelect;
export type InsertWebsiteSetting = z.infer<typeof insertWebsiteSettingSchema>;

export type CryptoAddress = typeof cryptoAddresses.$inferSelect;
export type InsertCryptoAddress = z.infer<typeof insertCryptoAddressSchema>;

export type AdminLog = typeof adminLogs.$inferSelect;
export type InsertAdminLog = z.infer<typeof insertAdminLogSchema>;