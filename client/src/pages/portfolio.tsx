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
  Search,
  ChevronDown,
  ChevronUp,
  Globe,
  Shield,
  Zap
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
  const [expandedHoldings, setExpandedHoldings] = useState<Set<string>>(new Set());

  // Get current prices from market data
  const getAssetPrice = (symbol: string) => {
    const asset = allAssets.find(a => a.symbol === symbol);
    return asset ? asset.price : 0;
  };

  // Holdings data - Empty until user makes actual purchases
  const holdings: Holding[] = [];
  
  // Check if user has any actual holdings
  const hasHoldings = holdings.length > 0;

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
  const totalGainLossPercent = totalPortfolioValue > 0 ? (totalGainLoss / (totalPortfolioValue - totalGainLoss)) * 100 : 0;

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

  const toggleExpanded = (symbol: string) => {
    const newExpanded = new Set(expandedHoldings);
    if (newExpanded.has(symbol)) {
      newExpanded.delete(symbol);
    } else {
      newExpanded.add(symbol);
    }
    setExpandedHoldings(newExpanded);
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
              {totalPortfolioValue > 0 ? ((totalStockValue / totalPortfolioValue) * 100).toFixed(1) : '0.0'}% of portfolio
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
              {totalPortfolioValue > 0 ? ((totalCryptoValue / totalPortfolioValue) * 100).toFixed(1) : '0.0'}% of portfolio
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
        <CardContent className="p-6">
          <div className="h-96 relative bg-gradient-to-br from-slate-50 via-white to-slate-50 border-2 border-gray-200 rounded-xl mx-auto max-w-full overflow-hidden">
            <svg className="w-full h-full p-4" viewBox="0 0 800 280" preserveAspectRatio="xMidYMid meet">
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
            
            {/* Chart value display - properly centered */}
            <div className="absolute top-12 left-1/2 transform -translate-x-1/2 text-center z-10">
              <div className="bg-white/95 backdrop-blur-sm rounded-xl px-8 py-5 shadow-lg border-2 border-green-200">
                <div className="text-center space-y-3">
                  {/* Portfolio Value Label */}
                  <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Current Portfolio Value</div>
                  
                  {/* Current Value */}
                  <div className="text-4xl font-bold text-gray-600">{hasHoldings ? formatCurrency(totalPortfolioValue) : "$0.00"}</div>
                  
                  {/* Today's Performance */}
                  <div className={`flex items-center justify-center space-x-2 ${hasHoldings && totalGainLoss >= 0 ? 'text-green-600 bg-green-50/30' : hasHoldings && totalGainLoss < 0 ? 'text-red-600 bg-red-50/30' : 'text-gray-600 bg-gray-50/30'} rounded-lg py-2 px-4`}>
                    <span className="text-lg font-semibold">
                      {hasHoldings 
                        ? (showValues ? `${totalGainLoss >= 0 ? '+' : ''}${formatCurrency(Math.abs(totalGainLoss))}` : "••••••••")
                        : "$0.00"
                      }
                    </span>
                    <span className="text-sm font-medium">
                      {hasHoldings 
                        ? (showValues ? `(${totalGainLoss >= 0 ? '+' : ''}${totalGainLossPercent.toFixed(2)}%) Today` : "••••••••")
                        : "(0.00%) Today"
                      }
                    </span>
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
      {hasHoldings ? (
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
                  <div key={holding.symbol} className="border rounded-lg hover:bg-gray-50 transition-all duration-300 card-hover overflow-hidden">
                    {/* Main holding info */}
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center space-x-4">
                        <holding.icon className={`h-12 w-12 ${holding.color}`} />
                        <div>
                          <div className="font-bold text-lg">{holding.symbol}</div>
                          <div className="text-sm text-gray-600">{holding.name}</div>
                          <div className="text-xs text-gray-500">
                            {formatShares(holding.shares, holding.symbol)} shares • {formatCurrency(holding.currentPrice)}/share
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-xl">{showValues ? formatCurrency(holding.value) : "••••••••"}</div>
                        <div className={`text-sm font-medium ${holding.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {showValues ? `${holding.changePercent >= 0 ? '+' : ''}${holding.changePercent.toFixed(2)}%` : "••••••••"}
                        </div>
                        <div className="text-xs text-gray-500">
                          Avg: {showValues ? formatCurrency(holding.avgPrice) : "••••••••"}
                        </div>
                      </div>
                    </div>
                    
                    {/* Detailed stock metrics */}
                    <div className="bg-gray-50 px-4 py-3 border-t">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div>
                          <div className="text-gray-500 font-medium">Market Cap</div>
                          <div className="font-semibold">
                            {holding.symbol === 'AAPL' && '$3.5T'}
                            {holding.symbol === 'TSLA' && '$800.2B'}
                            {holding.symbol === 'GOOGL' && '$2.1T'}
                            {holding.symbol === 'MSFT' && '$3.1T'}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 font-medium">P/E Ratio</div>
                          <div className="font-semibold">
                            {holding.symbol === 'AAPL' && '29.85'}
                            {holding.symbol === 'TSLA' && '65.12'}
                            {holding.symbol === 'GOOGL' && '23.47'}
                            {holding.symbol === 'MSFT' && '35.29'}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 font-medium">52W High</div>
                          <div className="font-semibold">
                            {holding.symbol === 'AAPL' && '$237.23'}
                            {holding.symbol === 'TSLA' && '$278.98'}
                            {holding.symbol === 'GOOGL' && '$191.75'}
                            {holding.symbol === 'MSFT' && '$468.35'}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 font-medium">52W Low</div>
                          <div className="font-semibold">
                            {holding.symbol === 'AAPL' && '$164.08'}
                            {holding.symbol === 'TSLA' && '$138.80'}
                            {holding.symbol === 'GOOGL' && '$129.40'}
                            {holding.symbol === 'MSFT' && '$309.45'}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 font-medium">Dividend Yield</div>
                          <div className="font-semibold">
                            {holding.symbol === 'AAPL' && '0.44%'}
                            {holding.symbol === 'TSLA' && 'N/A'}
                            {holding.symbol === 'GOOGL' && 'N/A'}
                            {holding.symbol === 'MSFT' && '0.72%'}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 font-medium">Volume</div>
                          <div className="font-semibold">
                            {holding.symbol === 'AAPL' && '47.2M'}
                            {holding.symbol === 'TSLA' && '89.4M'}
                            {holding.symbol === 'GOOGL' && '23.8M'}
                            {holding.symbol === 'MSFT' && '31.5M'}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 font-medium">Beta</div>
                          <div className="font-semibold">
                            {holding.symbol === 'AAPL' && '1.25'}
                            {holding.symbol === 'TSLA' && '2.31'}
                            {holding.symbol === 'GOOGL' && '1.05'}
                            {holding.symbol === 'MSFT' && '0.89'}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 font-medium">Sector</div>
                          <div className="font-semibold">
                            {holding.symbol === 'AAPL' && 'Technology'}
                            {holding.symbol === 'TSLA' && 'Automotive'}
                            {holding.symbol === 'GOOGL' && 'Technology'}
                            {holding.symbol === 'MSFT' && 'Technology'}
                          </div>
                        </div>
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
                  <div key={holding.symbol} className="border rounded-lg hover:bg-gray-50 transition-all duration-300 card-hover overflow-hidden">
                    {/* Main holding info */}
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center space-x-4">
                        <holding.icon className={`h-12 w-12 ${holding.color}`} />
                        <div>
                          <div className="font-bold text-lg">{holding.symbol}</div>
                          <div className="text-sm text-gray-600">{holding.name}</div>
                          <div className="text-xs text-gray-500">
                            {formatShares(holding.shares, holding.symbol)} coins • {formatCurrency(holding.currentPrice)}/coin
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-xl">{showValues ? formatCurrency(holding.value) : "••••••••"}</div>
                        <div className={`text-sm font-medium ${holding.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {showValues ? `${holding.changePercent >= 0 ? '+' : ''}${holding.changePercent.toFixed(2)}%` : "••••••••"}
                        </div>
                        <div className="text-xs text-gray-500">
                          Avg: {showValues ? formatCurrency(holding.avgPrice) : "••••••••"}
                        </div>
                      </div>
                    </div>
                    
                    {/* Detailed crypto metrics */}
                    <div className="bg-gray-50 px-4 py-3 border-t">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div>
                          <div className="text-gray-500 font-medium">Market Cap</div>
                          <div className="font-semibold">
                            {holding.symbol === 'BTC' && '$1.97T'}
                            {holding.symbol === 'ETH' && '$425.3B'}
                            {holding.symbol === 'SOL' && '$115.8B'}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 font-medium">24h Volume</div>
                          <div className="font-semibold">
                            {holding.symbol === 'BTC' && '$28.4B'}
                            {holding.symbol === 'ETH' && '$18.7B'}
                            {holding.symbol === 'SOL' && '$3.2B'}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 font-medium">All-Time High</div>
                          <div className="font-semibold">
                            {holding.symbol === 'BTC' && '$108,135'}
                            {holding.symbol === 'ETH' && '$4,891'}
                            {holding.symbol === 'SOL' && '$263.83'}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 font-medium">Circulating Supply</div>
                          <div className="font-semibold">
                            {holding.symbol === 'BTC' && '19.8M BTC'}
                            {holding.symbol === 'ETH' && '120.4M ETH'}
                            {holding.symbol === 'SOL' && '474.3M SOL'}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 font-medium">Market Dominance</div>
                          <div className="font-semibold">
                            {holding.symbol === 'BTC' && '55.2%'}
                            {holding.symbol === 'ETH' && '12.8%'}
                            {holding.symbol === 'SOL' && '3.5%'}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 font-medium">7d Change</div>
                          <div className={`font-semibold ${
                            (holding.symbol === 'BTC' && 'text-green-600') ||
                            (holding.symbol === 'ETH' && 'text-green-600') ||
                            (holding.symbol === 'SOL' && 'text-red-600') ||
                            'text-gray-700'
                          }`}>
                            {holding.symbol === 'BTC' && '+8.4%'}
                            {holding.symbol === 'ETH' && '+12.1%'}
                            {holding.symbol === 'SOL' && '-2.8%'}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 font-medium">Rank</div>
                          <div className="font-semibold">
                            {holding.symbol === 'BTC' && '#1'}
                            {holding.symbol === 'ETH' && '#2'}
                            {holding.symbol === 'SOL' && '#4'}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 font-medium">Technology</div>
                          <div className="font-semibold">
                            {holding.symbol === 'BTC' && 'Proof of Work'}
                            {holding.symbol === 'ETH' && 'Proof of Stake'}
                            {holding.symbol === 'SOL' && 'Proof of History'}
                          </div>
                        </div>
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
      ) : (
        /* Empty State for No Holdings */
        <div className="space-y-6">
          <Card className="border-dashed border-2 border-gray-300">
            <CardContent className="p-12">
              <div className="text-center space-y-6">
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
                  <PieChart className="w-12 h-12 text-gray-400" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-gray-900">No Holdings Yet</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Your portfolio is empty. Start investing in stocks and cryptocurrencies to see your holdings here.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                  <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BarChart3 className="w-6 h-6 text-blue-600" />
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">Trade Stocks</h4>
                    <p className="text-sm text-gray-600">
                      Invest in your favorite companies like Apple, Tesla, and Google
                    </p>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <SiBitcoin className="w-6 h-6 text-orange-600" />
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">Buy Crypto</h4>
                    <p className="text-sm text-gray-600">
                      Trade Bitcoin, Ethereum, Solana and other cryptocurrencies
                    </p>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">Track Growth</h4>
                    <p className="text-sm text-gray-600">
                      Monitor your investment performance and portfolio growth
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button className="w-full max-w-sm mx-auto bg-green-600 hover:bg-green-700">
                    <ArrowUpRight className="w-4 h-4 mr-2" />
                    Start Trading
                  </Button>
                  <p className="text-xs text-gray-500">
                    All trades require admin approval before execution
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}