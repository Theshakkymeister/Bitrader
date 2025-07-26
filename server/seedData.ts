import { storage } from './storage';

// Seed data for algorithms
const algorithmSeedData = [
  {
    name: 'Forex Algorithm',
    type: 'forex',
    description: 'Advanced forex trading algorithm focusing on major currency pairs',
    active: true,
  },
  {
    name: 'Gold Algorithm',
    type: 'gold',
    description: 'Precious metals trading algorithm optimized for XAU/USD',
    active: true,
  },
  {
    name: 'Stocks Algorithm',
    type: 'stocks',
    description: 'Equity trading algorithm for major stock indices and blue-chip stocks',
    active: true,
  },
  {
    name: 'Crypto Algorithm',
    type: 'crypto',
    description: 'Cryptocurrency trading algorithm for Bitcoin, Ethereum, and major altcoins',
    active: true,
  },
];

// Function to seed initial algorithms
export async function seedAlgorithms() {
  try {
    const existingAlgorithms = await storage.getAlgorithms();
    
    if (existingAlgorithms.length === 0) {
      console.log('Seeding algorithms...');
      
      for (const algorithmData of algorithmSeedData) {
        await storage.createAlgorithm(algorithmData);
      }
      
      console.log('Algorithms seeded successfully');
    }
  } catch (error) {
    console.error('Error seeding algorithms:', error);
  }
}

// Function to initialize user portfolio with demo data
export async function initializeUserPortfolio(userId: string) {
  try {
    let portfolio = await storage.getPortfolio(userId);
    
    if (!portfolio) {
      // Create initial portfolio with demo values for new users
      portfolio = await storage.createPortfolio({
        userId,
        totalBalance: '125849.32',
        todayPL: '2473.85',
        winRate: '78.4',
        activeAlgorithms: 4,
      });

      // Get all algorithms for seeding performance metrics
      const algorithms = await storage.getAlgorithms();

      // Create performance metrics for each algorithm
      const performanceMetrics = [
        {
          userId,
          algorithmId: algorithms.find(a => a.type === 'forex')?.id || '',
          sharpeRatio: '2.14',
          maxDrawdown: '-8.2',
          avgTradeDuration: '4.2',
          profitFactor: '1.89',
          totalTrades: 347,
          winningTrades: 285,
        },
        {
          userId,
          algorithmId: algorithms.find(a => a.type === 'gold')?.id || '',
          sharpeRatio: '1.85',
          maxDrawdown: '-6.5',
          avgTradeDuration: '3.8',
          profitFactor: '1.67',
          totalTrades: 234,
          winningTrades: 176,
        },
        {
          userId,
          algorithmId: algorithms.find(a => a.type === 'stocks')?.id || '',
          sharpeRatio: '1.92',
          maxDrawdown: '-7.1',
          avgTradeDuration: '5.6',
          profitFactor: '1.73',
          totalTrades: 412,
          winningTrades: 328,
        },
        {
          userId,
          algorithmId: algorithms.find(a => a.type === 'crypto')?.id || '',
          sharpeRatio: '2.05',
          maxDrawdown: '-12.3',
          avgTradeDuration: '2.9',
          profitFactor: '1.95',
          totalTrades: 254,
          winningTrades: 190,
        },
      ];

      for (const metric of performanceMetrics) {
        if (metric.algorithmId) {
          await storage.createPerformanceMetric(metric);
        }
      }

      // Create sample trades for demonstration
      const sampleTrades = [
        {
          userId,
          algorithmId: algorithms.find(a => a.type === 'forex')?.id || '',
          pair: 'EUR/USD',
          type: 'BUY',
          entryPrice: '1.0524',
          exitPrice: '1.0587',
          profitLoss: '247.50',
          status: 'closed',
          closedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        },
        {
          userId,
          algorithmId: algorithms.find(a => a.type === 'gold')?.id || '',
          pair: 'XAU/USD',
          type: 'SELL',
          entryPrice: '2089.45',
          exitPrice: '2067.20',
          profitLoss: '445.00',
          status: 'closed',
          closedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        },
        {
          userId,
          algorithmId: algorithms.find(a => a.type === 'crypto')?.id || '',
          pair: 'BTC/USD',
          type: 'BUY',
          entryPrice: '42150.00',
          exitPrice: '42890.00',
          profitLoss: '185.25',
          status: 'closed',
          closedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        },
        {
          userId,
          algorithmId: algorithms.find(a => a.type === 'forex')?.id || '',
          pair: 'GBP/USD',
          type: 'BUY',
          entryPrice: '1.2634',
          exitPrice: '1.2689',
          profitLoss: '137.50',
          status: 'closed',
          closedAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
        },
        {
          userId,
          algorithmId: algorithms.find(a => a.type === 'stocks')?.id || '',
          pair: 'SPY',
          type: 'BUY',
          entryPrice: '485.23',
          exitPrice: '487.91',
          profitLoss: '89.20',
          status: 'closed',
          closedAt: new Date(Date.now() - 10 * 60 * 60 * 1000), // 10 hours ago
        },
      ];

      for (const trade of sampleTrades) {
        if (trade.algorithmId) {
          await storage.createTrade(trade);
        }
      }

      console.log(`Initialized portfolio and demo data for user ${userId}`);
    }

    return portfolio;
  } catch (error) {
    console.error('Error initializing user portfolio:', error);
    throw error;
  }
}

// Function to run all seed operations
export async function runSeedOperations() {
  await seedAlgorithms();
}

