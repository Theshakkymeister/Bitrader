import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Eye,
  EyeOff,
  ArrowUpRight,
  ArrowDownRight,
  Search
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { SiApple, SiBitcoin, SiTesla, SiGoogle, SiEthereum } from "react-icons/si";
import { allAssets } from "@/lib/marketData";

interface Holding {
  symbol: string;
  name: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  value: number;
  change: number;
  changePercent: number;
  icon: React.ComponentType<any>;
  color: string;
  type: 'stock' | 'crypto';
}

export default function Portfolio() {
  const [showValues, setShowValues] = useState(true);
  const [timeframe, setTimeframe] = useState("1d");
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  // Get current prices from market data
  const getAssetPrice = (symbol: string) => {
    const asset = allAssets.find(a => a.symbol === symbol);
    return asset ? asset.price : 0;
  };

  const holdings: Holding[] = [
    // Stock Holdings
    {
      symbol: "AAPL",
      name: "Apple Inc.",
      shares: 32,
      avgPrice: 175.25,
      currentPrice: getAssetPrice("AAPL"),
      value: 32 * getAssetPrice("AAPL"),
      change: getAssetPrice("AAPL") - 175.25,
      changePercent: ((getAssetPrice("AAPL") - 175.25) / 175.25) * 100,
      icon: SiApple,
      color: "text-gray-700",
      type: "stock"
    },
    {
      symbol: "TSLA",
      name: "Tesla, Inc.",
      shares: 15,
      avgPrice: 245.80,
      currentPrice: getAssetPrice("TSLA"),
      value: 15 * getAssetPrice("TSLA"),
      change: getAssetPrice("TSLA") - 245.80,
      changePercent: ((getAssetPrice("TSLA") - 245.80) / 245.80) * 100,
      icon: SiTesla,
      color: "text-red-500",
      type: "stock"
    },
    {
      symbol: "GOOGL",
      name: "Alphabet Inc.",
      shares: 23,
      avgPrice: 142.15,
      currentPrice: getAssetPrice("GOOGL"),
      value: 23 * getAssetPrice("GOOGL"),
      change: getAssetPrice("GOOGL") - 142.15,
      changePercent: ((getAssetPrice("GOOGL") - 142.15) / 142.15) * 100,
      icon: SiGoogle,
      color: "text-blue-500",
      type: "stock"
    },
    {
      symbol: "MSFT",
      name: "Microsoft Corp.",
      shares: 12,
      avgPrice: 412.33,
      currentPrice: getAssetPrice("MSFT"),
      value: 12 * getAssetPrice("MSFT"),
      change: getAssetPrice("MSFT") - 412.33,
      changePercent: ((getAssetPrice("MSFT") - 412.33) / 412.33) * 100,
      icon: ({ className }: { className: string }) => (
        <div className={`${className} bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold`}>
          MS
        </div>
      ),
      color: "text-blue-600",
      type: "stock"
    },
    // Crypto Holdings
    {
      symbol: "BTC",
      name: "Bitcoin",
      shares: 0.1234,
      avgPrice: 65420.00,
      currentPrice: getAssetPrice("BTC"),
      value: 0.1234 * getAssetPrice("BTC"),
      change: getAssetPrice("BTC") - 65420.00,
      changePercent: ((getAssetPrice("BTC") - 65420.00) / 65420.00) * 100,
      icon: SiBitcoin,
      color: "text-orange-500",
      type: "crypto"
    },
    {
      symbol: "ETH",
      name: "Ethereum",
      shares: 1.2567,
      avgPrice: 3245.80,
      currentPrice: getAssetPrice("ETH"),
      value: 1.2567 * getAssetPrice("ETH"),
      change: getAssetPrice("ETH") - 3245.80,
      changePercent: ((getAssetPrice("ETH") - 3245.80) / 3245.80) * 100,
      icon: SiEthereum,
      color: "text-blue-500",
      type: "crypto"
    },
    {
      symbol: "SOL",
      name: "Solana",
      shares: 15.67,
      avgPrice: 185.25,
      currentPrice: getAssetPrice("SOL"),
      value: 15.67 * getAssetPrice("SOL"),
      change: getAssetPrice("SOL") - 185.25,
      changePercent: ((getAssetPrice("SOL") - 185.25) / 185.25) * 100,
      icon: ({ className }: { className: string }) => (
        <div className={`${className} bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold`}>
          S
        </div>
      ),
      color: "text-purple-500",
      type: "crypto"
    }
  ];

  const stockHoldings = holdings.filter(h => h.type === 'stock');
  const cryptoHoldings = holdings.filter(h => h.type === 'crypto');
  
  // Filter holdings based on search query
  const filterHoldings = (holdingsArray: Holding[]) => {
    if (!searchQuery.trim()) return holdingsArray;
    return holdingsArray.filter(holding => 
      holding.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      holding.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };
  
  const filteredHoldings = filterHoldings(holdings);
  const filteredStockHoldings = filterHoldings(stockHoldings);
  const filteredCryptoHoldings = filterHoldings(cryptoHoldings);
  
  const totalStockValue = stockHoldings.reduce((sum, h) => sum + h.value, 0);
  const totalCryptoValue = cryptoHoldings.reduce((sum, h) => sum + h.value, 0);
  const totalPortfolioValue = totalStockValue + totalCryptoValue;
  
  const totalGainLoss = holdings.reduce((sum, h) => sum + (h.change * h.shares), 0);
  const totalGainLossPercent = (totalGainLoss / (totalPortfolioValue - totalGainLoss)) * 100;

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setPortfolioValue(totalPortfolioValue);
    }, 2000);
    return () => clearInterval(interval);
  }, [totalPortfolioValue]);

  const formatCurrency = (value: number) => {
    return showValues ? `$${value.toLocaleString('en-US', {minimumFractionDigits: 2})}` : "••••••••";
  };

  const formatShares = (shares: number, symbol: string) => {
    const decimals = ['BTC', 'ETH'].includes(symbol) ? 4 : 0;
    return showValues ? shares.toFixed(decimals) : "••••••••";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <PieChart className="h-6 w-6 text-gray-700" />
          <h1 className="text-2xl font-bold text-gray-900">Portfolio</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowValues(!showValues)}
          className="flex items-center space-x-2"
        >
          {showValues ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          <span>{showValues ? "Hide" : "Show"} Values</span>
        </Button>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Portfolio Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPortfolioValue)}</div>
            <div className={`flex items-center text-sm mt-1 ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalGainLoss >= 0 ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
              {showValues ? `${totalGainLoss >= 0 ? '+' : ''}${formatCurrency(totalGainLoss).replace('$', '$')} (${totalGainLossPercent.toFixed(2)}%)` : "••••••••"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Stock Holdings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalStockValue)}</div>
            <div className="text-sm text-gray-500 mt-1">
              {((totalStockValue / totalPortfolioValue) * 100).toFixed(1)}% of portfolio
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Crypto Holdings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCryptoValue)}</div>
            <div className="text-sm text-gray-500 mt-1">
              {((totalCryptoValue / totalPortfolioValue) * 100).toFixed(1)}% of portfolio
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Animated Portfolio Chart */}
      <Card className="overflow-hidden border-2 border-gray-300 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b-2 border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <CardTitle className="text-xl">Portfolio Performance</CardTitle>
            </div>
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-24 border-2 border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">1D</SelectItem>
                <SelectItem value="1w">1W</SelectItem>
                <SelectItem value="1m">1M</SelectItem>
                <SelectItem value="3m">3M</SelectItem>
                <SelectItem value="1y">1Y</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="h-96 relative bg-gradient-to-br from-slate-50 via-white to-slate-50 border-2 border-gray-200 rounded-xl mx-auto w-full">
            <svg className="w-full h-full p-4" viewBox="0 0 800 280" preserveAspectRatio="none">
              <defs>
                <linearGradient id="portfolioGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#059669" stopOpacity="0.15"/>
                  <stop offset="50%" stopColor="#059669" stopOpacity="0.08"/>
                  <stop offset="100%" stopColor="#059669" stopOpacity="0"/>
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge> 
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                <filter id="shadow">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#059669" floodOpacity="0.3"/>
                </filter>
              </defs>
              
              {/* Grid lines */}
              <g stroke="#d1d5db" strokeWidth="0.8" opacity="0.6">
                {[60, 110, 160, 210].map(y => (
                  <line key={y} x1="60" y1={y} x2="740" y2={y} />
                ))}
                {[160, 280, 400, 520, 640].map(x => (
                  <line key={x} x1={x} y1="40" x2={x} y2="240" />
                ))}
              </g>
              
              {/* Portfolio trend line with smooth curve */}
              <path 
                d="M 80,200 C 160,190 200,175 260,165 S 400,150 460,140 S 600,125 660,115 S 720,105 740,95" 
                stroke="#059669" 
                strokeWidth="5" 
                fill="none"
                filter="url(#glow)"
                className="animate-pulse"
                style={{
                  strokeDasharray: '1400',
                  strokeDashoffset: '1400',
                  animation: 'drawLine 3s ease-in-out forwards, pulse 2s ease-in-out infinite 3s'
                }}
              />
              
              {/* Filled area under curve */}
              <path 
                d="M 80,200 C 160,190 200,175 260,165 S 400,150 460,140 S 600,125 660,115 S 720,105 740,95 L 740,240 L 80,240 Z" 
                fill="url(#portfolioGradient)"
                className="animate-fade-in"
                style={{ 
                  opacity: 0,
                  animation: 'fadeIn 2s ease-in-out 1s forwards'
                }}
              />
              
              {/* Animated glowing dot at the end */}
              <g className="animate-bounce">
                <circle cx="740" cy="95" r="12" fill="#059669" opacity="0.1">
                  <animate attributeName="r" values="12;20;12" dur="2s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.1;0.02;0.1" dur="2s" repeatCount="indefinite"/>
                </circle>
                <circle cx="740" cy="95" r="8" fill="#059669" opacity="0.3">
                  <animate attributeName="r" values="8;12;8" dur="1.5s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.3;0.1;0.3" dur="1.5s" repeatCount="indefinite"/>
                </circle>
                <circle cx="740" cy="95" r="5" fill="#059669" filter="url(#shadow)"/>
                <circle cx="740" cy="95" r="2.5" fill="#ffffff"/>
              </g>
              
              {/* Value indicator line connecting to centered display */}
              <line x1="740" y1="95" x2="400" y2="50" stroke="#059669" strokeWidth="2" opacity="0.4" strokeDasharray="4,4">
                <animate attributeName="stroke-dashoffset" values="0;8" dur="1s" repeatCount="indefinite"/>
              </line>
              
              {/* Data points */}
              {[
                {x: 200, y: 180}, {x: 360, y: 155}, {x: 520, y: 130}, {x: 680, y: 110}
              ].map((point, index) => (
                <g key={index}>
                  <circle 
                    cx={point.x} 
                    cy={point.y} 
                    r="6" 
                    fill="#059669" 
                    opacity="0.8"
                    className="animate-pulse"
                    style={{ animationDelay: `${index * 0.5 + 2}s` }}
                  />
                  <circle cx={point.x} cy={point.y} r="3" fill="#ffffff"/>
                </g>
              ))}
            </svg>
            
            {/* Performance indicators */}
            <div className="absolute top-6 left-6 text-sm text-gray-600">
              <div className="bg-white/95 backdrop-blur-sm rounded-lg px-4 py-3 shadow-md border-2 border-green-100">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-semibold text-gray-700">Live Market Data</span>
                </div>
              </div>
            </div>
            
            {/* Chart value display - centered with the green line */}
            <div className="absolute top-16 left-1/2 transform -translate-x-1/2 translate-x-8 text-center portfolio-value-display">
              <div className="bg-white/95 backdrop-blur-sm rounded-xl px-8 py-5 shadow-lg border-2 border-green-200">
                <div className="text-center space-y-3">
                  {/* Portfolio Value Label */}
                  <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Current Portfolio Value</div>
                  
                  {/* Current Value */}
                  <div className="text-4xl font-bold text-green-600">$25,235.99</div>
                  
                  {/* Today's Performance */}
                  <div className="flex items-center justify-center space-x-2 text-green-600 bg-green-50/30 rounded-lg py-2 px-4">
                    <span className="text-lg font-semibold">+$373.49</span>
                    <span className="text-sm font-medium">(+1.48%) Today</span>
                  </div>
                </div>
              </div>
              {/* Connecting line to chart */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0.5 h-6 bg-green-300 opacity-60"></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Holdings Breakdown */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Holdings</TabsTrigger>
          <TabsTrigger value="stocks">Stocks</TabsTrigger>
          <TabsTrigger value="crypto">Crypto</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Holdings</CardTitle>
                  <CardDescription>Complete overview of your stock and cryptocurrency investments</CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search holdings..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredHoldings.length > 0 ? filteredHoldings.map((holding) => (
                  <div key={holding.symbol} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-all duration-300 card-hover">
                    <div className="flex items-center space-x-4">
                      <holding.icon className={`h-10 w-10 ${holding.color}`} />
                      <div>
                        <div className="font-medium">{holding.symbol}</div>
                        <div className="text-sm text-gray-500">{holding.name}</div>
                        <div className="text-xs text-gray-400">
                          {formatShares(holding.shares, holding.symbol)} {holding.type === 'stock' ? 'shares' : 'coins'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(holding.value)}</div>
                      <div className={`text-sm ${holding.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {showValues ? `${holding.changePercent >= 0 ? '+' : ''}${holding.changePercent.toFixed(2)}%` : "••••••••"}
                      </div>
                      <div className="text-xs text-gray-500">
                        Avg: {formatCurrency(holding.avgPrice)}
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-gray-500">
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No holdings found matching "{searchQuery}"</p>
                    <p className="text-sm mt-2">Try searching by symbol or company name</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stocks" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Stock Holdings</CardTitle>
                  <CardDescription>Your equity investments and their performance</CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search stocks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredStockHoldings.length > 0 ? filteredStockHoldings.map((holding) => (
                  <div key={holding.symbol} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-all duration-300 card-hover">
                    <div className="flex items-center space-x-4">
                      <holding.icon className={`h-10 w-10 ${holding.color}`} />
                      <div>
                        <div className="font-medium">{holding.symbol}</div>
                        <div className="text-sm text-gray-500">{holding.name}</div>
                        <div className="text-xs text-gray-400">
                          {formatShares(holding.shares, holding.symbol)} shares
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(holding.value)}</div>
                      <div className={`text-sm ${holding.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {showValues ? `${holding.changePercent >= 0 ? '+' : ''}${holding.changePercent.toFixed(2)}%` : "••••••••"}
                      </div>
                      <div className="text-xs text-gray-500">
                        Avg: {formatCurrency(holding.avgPrice)}
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-gray-500">
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No stocks found matching "{searchQuery}"</p>
                    <p className="text-sm mt-2">Try searching by symbol or company name</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="crypto" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Crypto Holdings</CardTitle>
                  <CardDescription>Your cryptocurrency investments and their performance</CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search crypto..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredCryptoHoldings.length > 0 ? filteredCryptoHoldings.map((holding) => (
                  <div key={holding.symbol} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-all duration-300 card-hover">
                    <div className="flex items-center space-x-4">
                      <holding.icon className={`h-10 w-10 ${holding.color}`} />
                      <div>
                        <div className="font-medium">{holding.symbol}</div>
                        <div className="text-sm text-gray-500">{holding.name}</div>
                        <div className="text-xs text-gray-400">
                          {formatShares(holding.shares, holding.symbol)} coins
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(holding.value)}</div>
                      <div className={`text-sm ${holding.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {showValues ? `${holding.changePercent >= 0 ? '+' : ''}${holding.changePercent.toFixed(2)}%` : "••••••••"}
                      </div>
                      <div className="text-xs text-gray-500">
                        Avg: {formatCurrency(holding.avgPrice)}
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-gray-500">
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No crypto found matching "{searchQuery}"</p>
                    <p className="text-sm mt-2">Try searching by symbol or cryptocurrency name</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}