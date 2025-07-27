// Real-time market data service for live prices
export interface MarketPrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  lastUpdate: Date;
}

// Real-time market data (simulated but realistic fluctuations)
const marketPrices: Record<string, MarketPrice> = {
  // Stocks
  'AAPL': { symbol: 'AAPL', price: 175.25, change: 0, changePercent: 0, lastUpdate: new Date() },
  'TSLA': { symbol: 'TSLA', price: 241.80, change: 0, changePercent: 0, lastUpdate: new Date() },
  'GOOGL': { symbol: 'GOOGL', price: 140.50, change: 0, changePercent: 0, lastUpdate: new Date() },
  'MSFT': { symbol: 'MSFT', price: 431.25, change: 0, changePercent: 0, lastUpdate: new Date() },
  'SPY': { symbol: 'SPY', price: 485.75, change: 0, changePercent: 0, lastUpdate: new Date() },
  
  // Cryptocurrencies
  'BTC': { symbol: 'BTC', price: 42000.00, change: 0, changePercent: 0, lastUpdate: new Date() },
  'ETH': { symbol: 'ETH', price: 2850.00, change: 0, changePercent: 0, lastUpdate: new Date() },
  'SOL': { symbol: 'SOL', price: 95.50, change: 0, changePercent: 0, lastUpdate: new Date() },
  'USDT': { symbol: 'USDT', price: 1.00, change: 0, changePercent: 0, lastUpdate: new Date() },
  'USDC': { symbol: 'USDC', price: 1.00, change: 0, changePercent: 0, lastUpdate: new Date() },
};

// Base prices for realistic fluctuations
const basePrices: Record<string, number> = {
  'AAPL': 175.25,
  'TSLA': 241.80,
  'GOOGL': 140.50,
  'MSFT': 431.25,
  'SPY': 485.75,
  'BTC': 42000.00,
  'ETH': 2850.00,
  'SOL': 95.50,
  'USDT': 1.00,
  'USDC': 1.00,
};

// Start real-time price simulation
function updateMarketPrices() {
  Object.keys(marketPrices).forEach(symbol => {
    const basePrice = basePrices[symbol];
    if (!basePrice) return;

    // Generate realistic price fluctuation (±2% for stocks, ±5% for crypto)
    const isStablecoin = symbol === 'USDT' || symbol === 'USDC';
    const isCrypto = ['BTC', 'ETH', 'SOL', 'USDT', 'USDC'].includes(symbol);
    
    let volatility = 0.02; // 2% for stocks
    if (isCrypto && !isStablecoin) {
      volatility = 0.05; // 5% for crypto
    } else if (isStablecoin) {
      volatility = 0.001; // 0.1% for stablecoins
    }

    // Random walk with mean reversion
    const randomChange = (Math.random() - 0.5) * volatility * 2;
    const meanReversion = (basePrice - marketPrices[symbol].price) * 0.001;
    const priceChange = randomChange + meanReversion;
    
    const oldPrice = marketPrices[symbol].price;
    const newPrice = Math.max(0.01, oldPrice * (1 + priceChange));
    
    const change = newPrice - oldPrice;
    const changePercent = (change / oldPrice) * 100;

    marketPrices[symbol] = {
      symbol,
      price: Number(newPrice.toFixed(isCrypto ? 2 : 2)),
      change: Number(change.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2)),
      lastUpdate: new Date()
    };
  });
}

// Update prices every 3 seconds for realistic market simulation
setInterval(updateMarketPrices, 3000);

export function getCurrentPrice(symbol: string): MarketPrice | null {
  return marketPrices[symbol] || null;
}

export function getAllPrices(): Record<string, MarketPrice> {
  return { ...marketPrices };
}

export function updatePositionValues(positions: any[]): any[] {
  return positions.map(position => {
    const marketData = getCurrentPrice(position.symbol);
    if (!marketData) return position;

    const quantity = parseFloat(position.quantity || '0');
    const entryPrice = parseFloat(position.price || '0');
    const currentPrice = marketData.price;
    const currentValue = currentPrice * quantity;
    
    // Calculate profit/loss
    let profitLoss = 0;
    if (position.type === 'buy') {
      profitLoss = (currentPrice - entryPrice) * quantity;
    } else {
      profitLoss = (entryPrice - currentPrice) * quantity;
    }
    
    const profitLossPercent = entryPrice > 0 ? (profitLoss / (entryPrice * quantity)) * 100 : 0;

    return {
      ...position,
      currentPrice: currentPrice.toString(),
      currentValue: currentValue.toString(),
      profitLoss: profitLoss.toString(),
      profitLossPercentage: profitLossPercent.toString(),
      marketChange: marketData.change,
      marketChangePercent: marketData.changePercent,
      lastUpdate: marketData.lastUpdate
    };
  });
}

console.log('🔄 Market data service initialized - Live prices updating every 3 seconds');