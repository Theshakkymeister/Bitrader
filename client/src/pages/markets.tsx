import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  marketCap?: number;
}

// Market symbols with full names
const marketSymbols = [
  { symbol: "AAPL", name: "Apple Inc." },
  { symbol: "TSLA", name: "Tesla Inc." },
  { symbol: "GOOGL", name: "Alphabet Inc." },
  { symbol: "MSFT", name: "Microsoft Corp." },
  { symbol: "NVDA", name: "NVIDIA Corp." },
  { symbol: "INTC", name: "Intel Corp." },
  { symbol: "SPY", name: "SPDR S&P 500 ETF" },
  { symbol: "QQQ", name: "Invesco QQQ Trust" },
  { symbol: "BTC", name: "Bitcoin" },
  { symbol: "ETH", name: "Ethereum" },
  { symbol: "SOL", name: "Solana" },
  { symbol: "USDT", name: "Tether" },
  { symbol: "USDC", name: "USD Coin" },
];

function MarketDataCard({ data }: { data: MarketData }) {
  const isPositive = data.change >= 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ 
        scale: 1.02,
        boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
    >
      <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-l-4 border-l-blue-500">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <motion.h3 
                className="font-semibold text-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {data.symbol}
              </motion.h3>
              <p className="text-sm text-muted-foreground truncate">{data.name}</p>
            </div>
            <div className="text-right">
              <motion.p 
                className="font-bold text-lg"
                animate={{ 
                  color: isPositive ? '#16a34a' : '#dc2626',
                  scale: [1, 1.05, 1]
                }}
                transition={{ duration: 0.5 }}
              >
                ${data.price.toFixed(2)}
              </motion.p>
              <motion.div 
                className={`flex items-center text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <motion.div
                  animate={{ rotate: isPositive ? 0 : 180 }}
                  transition={{ duration: 0.3 }}
                >
                  <TrendingUp className="w-3 h-3 mr-1" />
                </motion.div>
                <span>{data.change >= 0 ? '+' : ''}{data.change.toFixed(2)} ({data.changePercent.toFixed(2)}%)</span>
              </motion.div>
            </div>
          </div>

          <div className="flex justify-between items-end">
            <div className="flex space-x-4 text-xs text-muted-foreground">
              <span>Vol: {data.volume?.toLocaleString() || 'N/A'}</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {['BTC', 'ETH', 'SOL', 'USDT', 'USDC'].includes(data.symbol) ? 'Crypto' : 
               ['SPY', 'QQQ'].includes(data.symbol) ? 'ETF' : 'Stock'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function MarketsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch real market data
  const { data: marketPrices, isLoading: pricesLoading } = useQuery<any>({
    queryKey: ['/api/market-prices'],
    refetchInterval: 3000, // Update every 3 seconds like dashboard
  });

  // Fetch user portfolio data
  const { data: portfolio, isLoading: portfolioLoading } = useQuery<any>({
    queryKey: ['/api/portfolio'],
    refetchInterval: 5000,
  });

  // Create market data from real prices
  const marketData: MarketData[] = marketSymbols.map(item => {
    const priceData = marketPrices?.[item.symbol];
    return {
      symbol: item.symbol,
      name: item.name,
      price: priceData?.price || 0,
      change: priceData?.change || 0,
      changePercent: priceData?.changePercent || 0,
      volume: priceData?.volume || 0,
    };
  });

  const filteredData = marketData.filter(
    item =>
      item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isLoading = pricesLoading || portfolioLoading;

  return (
    <motion.div 
      className="min-h-screen bg-gray-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Markets</h1>
          <p className="text-gray-600">Real-time market data and analysis</p>
        </motion.div>

        {/* Search Bar */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search markets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </motion.div>

        {/* Market Overview Cards */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-white border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Market Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">Market Closed</div>
                <p className="text-xs text-gray-500 mt-1">Next open: 9:30 AM EST</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Active Securities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{filteredData.length}</div>
                <p className="text-xs text-gray-500 mt-1">Available for trading</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Portfolio Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    `$${((portfolio?.totalValue || portfolio?.balance) || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}`
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {((portfolio?.totalValue || portfolio?.balance) || 0) > 0 ? 'Current portfolio value' : 'Deposit funds to start trading'}
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Markets Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading market data...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredData.map((data, index) => (
                <motion.div
                  key={data.symbol}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.3, 
                    delay: 0.5 + (index * 0.05) 
                  }}
                >
                  <MarketDataCard data={data} />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {filteredData.length === 0 && (
          <motion.div 
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <p className="text-gray-500">No markets found matching your search.</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}