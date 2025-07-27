import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
  Zap,
  DollarSign,
  Clock,
  Activity,
  MoreVertical,
  X,
  Plus,
  Minus,
  Info,
  ExternalLink,
  Calendar,
  TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingUpIcon
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SiApple, SiBitcoin, SiTesla, SiGoogle, SiEthereum } from "react-icons/si";
import { allAssets } from "@/lib/marketData";
import { motion } from "framer-motion";

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
  const [, setLocation] = useLocation();
  const [showValues, setShowValues] = useState(true);
  const [timeframe, setTimeframe] = useState("1d");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedHoldings, setExpandedHoldings] = useState<Set<string>>(new Set());
  const [selectedHolding, setSelectedHolding] = useState<any>(null);
  const [showHoldingDetails, setShowHoldingDetails] = useState(false);
  const { user } = useAuth();

  // Get real-time portfolio data
  const { data: portfolio } = useQuery({
    queryKey: ['/api/portfolio'],
    enabled: !!user,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Get user's active trades with profit tracking
  const { data: trades = [] } = useQuery({
    queryKey: ['/api/trades'],
    enabled: !!user,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Get current prices from market data
  const getAssetPrice = (symbol: string) => {
    const asset = allAssets.find(a => a.symbol === symbol);
    return asset ? asset.price : 0;
  };

  // Get icon and color for a symbol
  const getAssetIcon = (symbol: string) => {
    const iconMap: { [key: string]: React.ComponentType<any> } = {
      'AAPL': SiApple,
      'TSLA': SiTesla,
      'GOOGL': SiGoogle,
      'MSFT': DollarSign,
      'BTC': SiBitcoin,
      'ETH': SiEthereum,
      'SOL': DollarSign,
      'USDT': DollarSign,
      'USDC': DollarSign,
      'INTC': Activity,
    };
    return iconMap[symbol] || DollarSign;
  };

  const getAssetColor = (symbol: string) => {
    const colorMap: { [key: string]: string } = {
      'AAPL': 'text-gray-600',
      'TSLA': 'text-red-600',
      'GOOGL': 'text-blue-600',
      'MSFT': 'text-blue-500',
      'BTC': 'text-orange-500',
      'ETH': 'text-blue-600',
      'SOL': 'text-purple-600',
      'USDT': 'text-green-600',
      'USDC': 'text-blue-600',
    };
    return colorMap[symbol] || 'text-gray-500';
  };

  // Convert trades to holdings format for display
  const activePositions = (trades as any[])
    .filter((trade: any) => trade.adminApproval === 'approved' && trade.isOpen)
    .map((trade: any) => ({
      id: trade.id,
      symbol: trade.symbol,
      name: `${trade.symbol} Position`,
      shares: parseFloat(trade.quantity),
      avgPrice: parseFloat(trade.price),
      currentPrice: parseFloat(trade.currentPrice || trade.price),
      value: parseFloat(trade.currentValue || trade.totalAmount),
      change: parseFloat(trade.profitLoss || '0'),
      changePercent: parseFloat(trade.profitLossPercentage || '0'),
      type: trade.assetType,
      tradeType: trade.type,
      entryDate: trade.executedAt || trade.createdAt,
      status: trade.status,
      icon: getAssetIcon(trade.symbol),
      color: getAssetColor(trade.symbol)
    }));

  const portfolioValue = (portfolio as any)?.totalBalance ? parseFloat((portfolio as any).totalBalance) : 0;
  const totalUnrealizedPL = activePositions.reduce((sum: number, pos: any) => sum + pos.change, 0);
  
  // Check if user has any actual holdings
  const hasHoldings = activePositions.length > 0;

  const stockPositions = activePositions.filter((p: any) => p.type === 'stock');
  const cryptoPositions = activePositions.filter((p: any) => p.type === 'crypto');
  
  // Filter positions based on search query
  const filterPositions = (positionsArray: any[]) => {
    if (!searchQuery.trim()) return positionsArray;
    return positionsArray.filter(position => 
      position.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      position.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };
  
  const filteredPositions = filterPositions(activePositions);
  const filteredStockPositions = filterPositions(stockPositions);
  const filteredCryptoPositions = filterPositions(cryptoPositions);
  
  // Define the variables used in the JSX
  const filteredHoldings = filteredPositions;
  const filteredStockHoldings = filteredStockPositions;
  const filteredCryptoHoldings = filteredCryptoPositions;
  
  const totalStockValue = filteredStockPositions.reduce((sum, p) => sum + p.value, 0);
  const totalCryptoValue = filteredCryptoPositions.reduce((sum, p) => sum + p.value, 0);
  const totalPositionsValue = totalStockValue + totalCryptoValue;
  
  const totalGainLoss = totalUnrealizedPL;
  const totalGainLossPercent = totalPositionsValue > 0 ? (totalGainLoss / totalPositionsValue) * 100 : 0;

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

  // If not authenticated, show login message
  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Log In</h1>
          <p className="text-gray-600 mb-6">You need to log in to view your portfolio.</p>
          <Button onClick={() => setLocation('/auth')}>Go to Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6 space-y-6">
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
            <div className="text-2xl font-bold">{formatCurrency(portfolioValue)}</div>
            <div className={`flex items-center text-sm mt-1 ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalGainLoss >= 0 ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
              {showValues ? `${totalGainLoss >= 0 ? '+' : ''}$${Math.abs(totalGainLoss).toFixed(2)} (${totalGainLossPercent.toFixed(2)}%)` : "••••••••"}
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
              {portfolioValue > 0 ? ((totalStockValue / portfolioValue) * 100).toFixed(1) : '0.0'}% of portfolio
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
              {portfolioValue > 0 ? ((totalCryptoValue / portfolioValue) * 100).toFixed(1) : '0.0'}% of portfolio
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
              
              {/* Animated glowing dot at the end - perfectly aligned with line endpoint */}
              <g>
                <circle cx="740" cy="95" r="12" fill="#059669" opacity="0.1">
                  <animate attributeName="r" values="12;20;12" dur="2s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.1;0.02;0.1" dur="2s" repeatCount="indefinite"/>
                </circle>
                <circle cx="740" cy="95" r="8" fill="#059669" opacity="0.3">
                  <animate attributeName="r" values="8;12;8" dur="1.5s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.3;0.1;0.3" dur="1.5s" repeatCount="indefinite"/>
                </circle>
                <circle cx="740" cy="95" r="5" fill="#059669" filter="url(#shadow)">
                  <animate attributeName="r" values="5;7;5" dur="1s" repeatCount="indefinite"/>
                </circle>
                <circle cx="740" cy="95" r="2.5" fill="#ffffff"/>
              </g>
              
              {/* Value indicator line connecting to centered display */}
              <line x1="740" y1="95" x2="400" y2="50" stroke="#059669" strokeWidth="2" opacity="0.4" strokeDasharray="4,4">
                <animate attributeName="stroke-dashoffset" values="0;8" dur="1s" repeatCount="indefinite"/>
              </line>
              
              {/* Line endpoint marker to ensure visual connection */}
              <circle cx="740" cy="95" r="6" fill="#059669" opacity="0.8" stroke="#ffffff" strokeWidth="2"/>
              
              {/* Small circle markers on the line to show exact connection points */}
              <circle cx="680" cy="108" r="2" fill="#059669" opacity="0.6" />
              <circle cx="520" cy="132" r="2" fill="#059669" opacity="0.6" />
              <circle cx="360" cy="152" r="2" fill="#059669" opacity="0.6" />
              <circle cx="200" cy="178" r="2" fill="#059669" opacity="0.6" />
              
              {/* Data points - positioned exactly on the curve path */}
              {[
                {x: 200, y: 178}, {x: 360, y: 152}, {x: 520, y: 132}, {x: 680, y: 108}
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
                  <div className="text-4xl font-bold text-gray-600">{hasHoldings ? formatCurrency(portfolioValue) : "$0.00"}</div>
                  
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
              <div className="space-y-3">
                {filteredHoldings.length > 0 ? filteredHoldings.map((holding) => (
                  <motion.div 
                    key={holding.id} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-xl bg-white hover:bg-gray-50 transition-all duration-300 overflow-hidden"
                  >
                    {/* Main holding row - clickable */}
                    <div 
                      className="flex items-center justify-between p-4 cursor-pointer"
                      onClick={() => {
                        setSelectedHolding(holding);
                        setShowHoldingDetails(true);
                      }}
                    >
                      <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          <holding.icon className={`h-8 w-8 sm:h-10 sm:w-10 ${holding.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <div className="font-semibold text-gray-900 text-sm sm:text-base">{holding.symbol}</div>
                            <Badge variant={holding.type === 'crypto' ? 'default' : 'secondary'} className="text-xs">
                              {holding.type === 'crypto' ? 'Crypto' : 'Stock'}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 truncate">{holding.name}</div>
                          <div className="text-xs text-gray-500">
                            {formatShares(holding.shares, holding.symbol)} {holding.type === 'stock' ? 'shares' : 'coins'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right flex-shrink-0">
                        <div className="font-semibold text-gray-900 text-sm sm:text-base">
                          {showValues ? formatCurrency(holding.value) : "••••••••"}
                        </div>
                        <div className={`text-sm flex items-center justify-end space-x-1 ${
                          holding.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {holding.changePercent >= 0 ? (
                            <TrendingUpIcon className="h-3 w-3" />
                          ) : (
                            <TrendingDownIcon className="h-3 w-3" />
                          )}
                          <span>
                            {showValues ? `${holding.changePercent >= 0 ? '+' : ''}${holding.changePercent.toFixed(2)}%` : "••••••••"}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Avg: {showValues ? formatCurrency(holding.avgPrice) : "••••••••"}
                        </div>
                      </div>
                      
                      <div className="ml-2 flex-shrink-0">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              setSelectedHolding(holding);
                              setShowHoldingDetails(true);
                            }}>
                              <Info className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              // Pre-fill trading form with buy order for this holding
                              const tradingUrl = `/trading?symbol=${holding.symbol}&type=buy&assetType=${holding.type}&name=${encodeURIComponent(holding.name)}`;
                              setLocation(tradingUrl);
                            }}>
                              <Plus className="h-4 w-4 mr-2" />
                              Buy More
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              // Pre-fill trading form with sell order for this holding
                              const tradingUrl = `/trading?symbol=${holding.symbol}&type=sell&assetType=${holding.type}&name=${encodeURIComponent(holding.name)}&quantity=${holding.shares}`;
                              setLocation(tradingUrl);
                            }}>
                              <Minus className="h-4 w-4 mr-2" />
                              Sell Position
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              window.open(`https://finance.yahoo.com/quote/${holding.symbol}`, '_blank');
                            }}>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Chart
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    
                    {/* Expandable details section */}
                    {expandedHoldings.has(holding.symbol) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t bg-gray-50 px-4 py-3"
                      >
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div>
                            <div className="text-gray-500 font-medium">Current Price</div>
                            <div className="font-semibold">{formatCurrency(holding.currentPrice)}</div>
                          </div>
                          <div>
                            <div className="text-gray-500 font-medium">Day Change</div>
                            <div className={`font-semibold ${holding.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {showValues ? formatCurrency(Math.abs(holding.change)) : "••••••••"}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500 font-medium">Total Return</div>
                            <div className={`font-semibold ${holding.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {showValues ? formatCurrency(Math.abs(holding.change * holding.shares)) : "••••••••"}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500 font-medium">Entry Date</div>
                            <div className="font-semibold">
                              {new Date(holding.entryDate || Date.now()).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-xs"
                            onClick={() => setLocation('/trading')}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Buy More
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-xs"
                            onClick={() => setLocation('/trading')}
                          >
                            <Minus className="h-3 w-3 mr-1" />
                            Sell
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-xs"
                            onClick={() => window.open(`https://finance.yahoo.com/quote/${holding.symbol}`, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Chart
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
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
              <div className="space-y-3">
                {filteredStockHoldings.length > 0 ? filteredStockHoldings.map((holding) => (
                  <motion.div 
                    key={holding.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-xl bg-white hover:bg-gray-50 transition-all duration-300 overflow-hidden"
                  >
                    {/* Main holding info - clickable */}
                    <div 
                      className="flex items-center justify-between p-4 cursor-pointer"
                      onClick={() => {
                        setSelectedHolding(holding);
                        setShowHoldingDetails(true);
                      }}
                    >
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
                  </motion.div>
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
                  <div key={holding.id} className="border rounded-lg hover:bg-gray-50 transition-all duration-300 card-hover overflow-hidden">
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <Card className="border-2 border-gray-200 shadow-lg">
            <CardContent className="p-12">
              <div className="text-center space-y-6">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center"
                >
                  <PieChart className="w-12 h-12 text-blue-600" />
                </motion.div>
                
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gray-900">No Active Positions</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Start trading stocks, crypto, and ETFs to build your portfolio and track your real-time performance here.
                  </p>
                </div>

                <div className="space-y-4">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 text-lg font-semibold shadow-lg"
                      onClick={() => setLocation("/trading")}
                    >
                      <Activity className="w-5 h-5 mr-2" />
                      Start Trading
                    </Button>
                  </motion.div>
                  
                  <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Shield className="w-4 h-4" />
                      <span>Secure</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Globe className="w-4 h-4" />
                      <span>Live Markets</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <DollarSign className="w-4 h-4" />
                      <span>Real-time P&L</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Detailed Holdings Modal */}
      <Dialog open={showHoldingDetails} onOpenChange={setShowHoldingDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedHolding && (
            <>
              <DialogHeader>
                <div className="flex items-center space-x-3">
                  <selectedHolding.icon className={`h-10 w-10 ${selectedHolding.color}`} />
                  <div>
                    <DialogTitle className="text-xl">{selectedHolding.symbol} Details</DialogTitle>
                    <DialogDescription>{selectedHolding.name}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-500 font-medium">Current Price</div>
                    <div className="text-lg font-bold">{formatCurrency(selectedHolding.currentPrice)}</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-500 font-medium">Holdings</div>
                    <div className="text-lg font-bold">
                      {formatShares(selectedHolding.shares, selectedHolding.symbol)}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-500 font-medium">Total Value</div>
                    <div className="text-lg font-bold">{showValues ? formatCurrency(selectedHolding.value) : "••••••••"}</div>
                  </div>
                  <div className={`text-center p-3 rounded-lg ${
                    selectedHolding.changePercent >= 0 ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                    <div className="text-xs text-gray-500 font-medium">Today's Change</div>
                    <div className={`text-lg font-bold ${
                      selectedHolding.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {showValues ? `${selectedHolding.changePercent >= 0 ? '+' : ''}${selectedHolding.changePercent.toFixed(2)}%` : "••••••••"}
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Performance Metrics
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Average Cost</div>
                      <div className="font-semibold">{showValues ? formatCurrency(selectedHolding.avgPrice) : "••••••••"}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Total Return</div>
                      <div className={`font-semibold ${selectedHolding.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {showValues ? formatCurrency(Math.abs(selectedHolding.change * selectedHolding.shares)) : "••••••••"}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Entry Date</div>
                      <div className="font-semibold">
                        {new Date(selectedHolding.entryDate || Date.now()).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Position Type</div>
                      <div className="font-semibold capitalize">{selectedHolding.tradeType || 'Long'}</div>
                    </div>
                  </div>
                </div>

                {/* Additional Info for Stocks */}
                {selectedHolding.type === 'stock' && (
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <Info className="h-4 w-4 mr-2" />
                      Stock Information
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">Market Cap</div>
                        <div className="font-semibold">
                          {selectedHolding.symbol === 'AAPL' && '$3.5T'}
                          {selectedHolding.symbol === 'TSLA' && '$800.2B'}
                          {selectedHolding.symbol === 'GOOGL' && '$2.1T'}
                          {selectedHolding.symbol === 'MSFT' && '$3.1T'}
                          {!['AAPL', 'TSLA', 'GOOGL', 'MSFT'].includes(selectedHolding.symbol) && 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">P/E Ratio</div>
                        <div className="font-semibold">
                          {selectedHolding.symbol === 'AAPL' && '29.85'}
                          {selectedHolding.symbol === 'TSLA' && '65.12'}
                          {selectedHolding.symbol === 'GOOGL' && '23.47'}
                          {selectedHolding.symbol === 'MSFT' && '35.29'}
                          {!['AAPL', 'TSLA', 'GOOGL', 'MSFT'].includes(selectedHolding.symbol) && 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">52W High</div>
                        <div className="font-semibold">
                          {selectedHolding.symbol === 'AAPL' && '$237.23'}
                          {selectedHolding.symbol === 'TSLA' && '$278.98'}
                          {selectedHolding.symbol === 'GOOGL' && '$191.75'}
                          {selectedHolding.symbol === 'MSFT' && '$468.35'}
                          {!['AAPL', 'TSLA', 'GOOGL', 'MSFT'].includes(selectedHolding.symbol) && 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">52W Low</div>
                        <div className="font-semibold">
                          {selectedHolding.symbol === 'AAPL' && '$164.08'}
                          {selectedHolding.symbol === 'TSLA' && '$138.80'}
                          {selectedHolding.symbol === 'GOOGL' && '$129.40'}
                          {selectedHolding.symbol === 'MSFT' && '$309.45'}
                          {!['AAPL', 'TSLA', 'GOOGL', 'MSFT'].includes(selectedHolding.symbol) && 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Additional Info for Crypto */}
                {selectedHolding.type === 'crypto' && (
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <Info className="h-4 w-4 mr-2" />
                      Cryptocurrency Information
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">Market Cap</div>
                        <div className="font-semibold">
                          {selectedHolding.symbol === 'BTC' && '$1.97T'}
                          {selectedHolding.symbol === 'ETH' && '$415.2B'}
                          {selectedHolding.symbol === 'SOL' && '$114.8B'}
                          {selectedHolding.symbol === 'USDT' && '$137.4B'}
                          {selectedHolding.symbol === 'USDC' && '$37.2B'}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">24h Volume</div>
                        <div className="font-semibold">
                          {selectedHolding.symbol === 'BTC' && '$28.4B'}
                          {selectedHolding.symbol === 'ETH' && '$18.7B'}
                          {selectedHolding.symbol === 'SOL' && '$4.2B'}
                          {selectedHolding.symbol === 'USDT' && '$56.8B'}
                          {selectedHolding.symbol === 'USDC' && '$12.1B'}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">All-Time High</div>
                        <div className="font-semibold">
                          {selectedHolding.symbol === 'BTC' && '$69,045'}
                          {selectedHolding.symbol === 'ETH' && '$4,891'}
                          {selectedHolding.symbol === 'SOL' && '$260'}
                          {selectedHolding.symbol === 'USDT' && '$1.32'}
                          {selectedHolding.symbol === 'USDC' && '$1.17'}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">Technology</div>
                        <div className="font-semibold">
                          {selectedHolding.symbol === 'BTC' && 'Proof of Work'}
                          {selectedHolding.symbol === 'ETH' && 'Proof of Stake'}
                          {selectedHolding.symbol === 'SOL' && 'Proof of History'}
                          {selectedHolding.symbol === 'USDT' && 'Stablecoin'}
                          {selectedHolding.symbol === 'USDC' && 'Stablecoin'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    className="flex-1"
                    onClick={() => {
                      setShowHoldingDetails(false);
                      const tradingUrl = `/trading?symbol=${selectedHolding.symbol}&type=buy&assetType=${selectedHolding.type}&name=${encodeURIComponent(selectedHolding.name)}`;
                      setLocation(tradingUrl);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Buy More
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      setShowHoldingDetails(false);
                      const tradingUrl = `/trading?symbol=${selectedHolding.symbol}&type=sell&assetType=${selectedHolding.type}&name=${encodeURIComponent(selectedHolding.name)}&quantity=${selectedHolding.shares}`;
                      setLocation(tradingUrl);
                    }}
                  >
                    <Minus className="h-4 w-4 mr-2" />
                    Sell Position
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="flex-1"
                    onClick={() => window.open(`https://finance.yahoo.com/quote/${selectedHolding.symbol}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Chart
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}