import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp, TrendingDown } from "lucide-react";
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

// Market data with $0.00 values for new users - displays real market structure
const marketData: MarketData[] = [
  { symbol: "AAPL", name: "Apple Inc.", price: 0.00, change: 0.00, changePercent: 0.00, volume: 0 },
  { symbol: "TSLA", name: "Tesla Inc.", price: 0.00, change: 0.00, changePercent: 0.00, volume: 0 },
  { symbol: "GOOGL", name: "Alphabet Inc.", price: 0.00, change: 0.00, changePercent: 0.00, volume: 0 },
  { symbol: "MSFT", name: "Microsoft Corp.", price: 0.00, change: 0.00, changePercent: 0.00, volume: 0 },
  { symbol: "NVDA", name: "NVIDIA Corp.", price: 0.00, change: 0.00, changePercent: 0.00, volume: 0 },
  { symbol: "SPY", name: "SPDR S&P 500 ETF", price: 0.00, change: 0.00, changePercent: 0.00, volume: 0 },
  { symbol: "QQQ", name: "Invesco QQQ Trust", price: 0.00, change: 0.00, changePercent: 0.00, volume: 0 },
  { symbol: "BTC", name: "Bitcoin", price: 0.00, change: 0.00, changePercent: 0.00, volume: 0 },
  { symbol: "ETH", name: "Ethereum", price: 0.00, change: 0.00, changePercent: 0.00, volume: 0 },
  { symbol: "SOL", name: "Solana", price: 0.00, change: 0.00, changePercent: 0.00, volume: 0 },
  { symbol: "USDT", name: "Tether", price: 0.00, change: 0.00, changePercent: 0.00, volume: 0 },
  { symbol: "USDC", name: "USD Coin", price: 0.00, change: 0.00, changePercent: 0.00, volume: 0 },
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

  const filteredData = marketData.filter(
    item =>
      item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                <div className="text-2xl font-bold text-gray-900">$0.00</div>
                <p className="text-xs text-gray-500 mt-1">Deposit funds to start trading</p>
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