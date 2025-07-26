import { storage } from "./storage";
import type { User, InsertPortfolio, InsertTrade, InsertPerformanceMetric } from "@shared/schema";

// External API integration for syncing data from your main trading website
export class ExternalAPIService {
  private baseURL: string;
  
  constructor() {
    // Replace with your actual trading website API URL
    this.baseURL = process.env.EXTERNAL_API_URL || 'https://api.bitraders.net';
  }

  // Authenticate and sync user data from external API
  async syncUserData(user: User): Promise<void> {
    if (!user.apiKey || !user.externalUserId) {
      console.log(`No API key or external user ID for user ${user.id}`);
      return;
    }

    try {
      // Sync portfolio data
      await this.syncPortfolioData(user);
      
      // Sync trading history
      await this.syncTradingHistory(user);
      
      // Sync performance metrics
      await this.syncPerformanceMetrics(user);

      // Update last sync time
      await storage.upsertUser({
        ...user,
        lastSyncAt: new Date(),
      });

      console.log(`Successfully synced data for user ${user.id}`);
    } catch (error) {
      console.error(`Failed to sync data for user ${user.id}:`, error);
    }
  }

  // Sync portfolio data from external API
  private async syncPortfolioData(user: User): Promise<void> {
    try {
      // Make API call to your website's portfolio endpoint
      const response = await fetch(`${this.baseURL}/api/portfolio/${user.externalUserId}`, {
        headers: {
          'Authorization': `Bearer ${user.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Portfolio API call failed: ${response.status}`);
      }

      const portfolioData = await response.json();
      
      // Check if user already has a portfolio
      const existingPortfolio = await storage.getPortfolio(user.id);
      
      const portfolioUpdate: InsertPortfolio = {
        userId: user.id,
        totalBalance: portfolioData.totalBalance?.toString() || '0',
        todayPL: portfolioData.todayPL?.toString() || '0',
        winRate: portfolioData.winRate?.toString() || '0',
        activeAlgorithms: portfolioData.activeAlgorithms || 0,
      };

      if (existingPortfolio) {
        await storage.updatePortfolio(user.id, portfolioUpdate);
      } else {
        await storage.createPortfolio(portfolioUpdate);
      }
      
    } catch (error) {
      console.error('Failed to sync portfolio data:', error);
      // In case of API failure, you might want to keep existing data or set defaults
    }
  }

  // Sync trading history from external API
  private async syncTradingHistory(user: User): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/api/trades/${user.externalUserId}?limit=100`, {
        headers: {
          'Authorization': `Bearer ${user.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Trades API call failed: ${response.status}`);
      }

      const tradesData = await response.json();
      
      // Get available algorithms to map trades
      const algorithms = await storage.getAlgorithms();
      const algorithmMap = new Map(algorithms.map(a => [a.type, a.id]));

      for (const tradeData of tradesData.trades || []) {
        // Check if trade already exists
        const existingTrades = await storage.getTrades(user.id);
        const tradeExists = existingTrades.some(t => t.externalTradeId === tradeData.id?.toString());
        
        if (!tradeExists) {
          // Find matching algorithm
          const algorithmId = algorithmMap.get(tradeData.algorithmType) || algorithms[0]?.id;
          
          if (algorithmId) {
            const newTrade: InsertTrade = {
              userId: user.id,
              algorithmId,
              pair: tradeData.pair || 'Unknown',
              type: tradeData.type || 'BUY',
              entryPrice: tradeData.entryPrice?.toString() || '0',
              exitPrice: tradeData.exitPrice?.toString() || null,
              profitLoss: tradeData.profitLoss?.toString() || null,
              volume: tradeData.volume?.toString() || null,
              duration: tradeData.duration || null,
              status: tradeData.status || 'open',
              externalTradeId: tradeData.id?.toString(),
            };

            await storage.createTrade(newTrade);
          }
        }
      }
      
    } catch (error) {
      console.error('Failed to sync trading history:', error);
    }
  }

  // Sync performance metrics from external API
  private async syncPerformanceMetrics(user: User): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/api/performance/${user.externalUserId}`, {
        headers: {
          'Authorization': `Bearer ${user.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Performance API call failed: ${response.status}`);
      }

      const performanceData = await response.json();
      const algorithms = await storage.getAlgorithms();
      
      for (const perfData of performanceData.metrics || []) {
        const algorithm = algorithms.find(a => a.type === perfData.algorithmType);
        
        if (algorithm) {
          // Check if performance metric already exists
          const existingMetrics = await storage.getPerformanceMetrics(user.id, algorithm.id);
          
          const metricData: InsertPerformanceMetric = {
            userId: user.id,
            algorithmId: algorithm.id,
            sharpeRatio: perfData.sharpeRatio?.toString() || null,
            maxDrawdown: perfData.maxDrawdown?.toString() || null,
            avgTradeDuration: perfData.avgTradeDuration?.toString() || null,
            profitFactor: perfData.profitFactor?.toString() || null,
            totalTrades: perfData.totalTrades || 0,
            winningTrades: perfData.winningTrades || 0,
          };

          if (existingMetrics.length === 0) {
            await storage.createPerformanceMetric(metricData);
          } else {
            // Update existing metric
            await storage.updatePerformanceMetric(existingMetrics[0].id, metricData);
          }
        }
      }
      
    } catch (error) {
      console.error('Failed to sync performance metrics:', error);
    }
  }

  // Test connection to external API
  async testConnection(apiKey: string, externalUserId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/api/user/${externalUserId}/verify`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}

export const externalAPI = new ExternalAPIService();