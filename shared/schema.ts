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
  status: varchar("status").notNull().default('open'), // 'open', 'closed'
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
