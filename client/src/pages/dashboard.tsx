import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Plus, DollarSign, BarChart3, PieChart, Activity, Eye, EyeOff } from "lucide-react";
import { SiApple, SiBitcoin, SiTesla, SiGoogle, SiEthereum } from "react-icons/si";
import { allAssets } from "@/lib/marketData";

// Portfolio performance data
const portfolioData = [
  { time: "9:30", value: 24890 },
  { time: "10:00", value: 24920 },
  { time: "10:30", value: 24955 },
  { time: "11:00", value: 24878 },
  { time: "11:30", value: 24903 },
  { time: "12:00", value: 24945 },
  { time: "12:30", value: 24982 },
  { time: "1:00", value: 25015 },
  { time: "1:30", value: 24998 },
  { time: "2:00", value: 25034 },
  { time: "2:30", value: 25067 },
  { time: "3:00", value: 25123 },
  { time: "3:30", value: 25156 },
  { time: "4:00", value: 25234 }
];

export default function Dashboard() {
  const [balance, setBalance] = useState(25234.56);
  const [showBalance, setShowBalance] = useState(true);
  const [portfolioValue, setPortfolioValue] = useState(25234);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Real-time portfolio simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setPortfolioValue(prev => {
        const change = (Math.random() - 0.5) * 10;
        const newValue = Math.max(prev + change, 20000);
        return newValue;
      });
      setLastUpdate(new Date());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const todayPLPercent = 1.48;
  const todayPL = portfolioValue * (todayPLPercent / 100);

  // Holdings data with real market data
  const getHolding = (symbol: string, shares: number) => {
    const asset = allAssets.find(a => a.symbol === symbol);
    if (!asset) return null;
    return {
      ...asset,
      shares,
      value: asset.price * shares
    };
  };

  const holdings = [
    getHolding('AAPL', 32),
    getHolding('MSFT', 12),
    getHolding('TSLA', 15),
    getHolding('GOOGL', 23),
    getHolding('BTC', 0.1234),
    getHolding('ETH', 1.2567),
    getHolding('SOL', 15.67)
  ].filter(h => h !== null);

  const totalStocks = holdings.filter(h => !['BTC', 'ETH', 'SOL'].includes(h.symbol)).reduce((sum, h) => sum + h.value, 0);
  const totalCrypto = holdings.filter(h => ['BTC', 'ETH', 'SOL'].includes(h.symbol)).reduce((sum, h) => sum + h.value, 0);
  
  return (
    <div className="min-h-screen bg-white">
      {/* Mobile-Optimized Portfolio Header */}
      <div className="bg-white p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-4 sm:space-y-0">
          <div className="flex-1">
            <div className="text-xs sm:text-sm text-gray-600 mb-1">Total Portfolio Value</div>
            <div className="text-2xl sm:text-4xl font-bold text-black mb-2">
              ${portfolioValue.toLocaleString('en-US', {minimumFractionDigits: 2})}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center text-xs sm:text-sm space-y-1 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center">
                <span className={`font-medium ${todayPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {todayPL >= 0 ? '+' : ''}${todayPL.toLocaleString('en-US', {minimumFractionDigits: 2})}
                </span>
                <span className={`ml-1 ${todayPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ({todayPL >= 0 ? '+' : ''}{todayPLPercent}%) Today
                </span>
              </div>
              <div className="text-gray-600 text-xs sm:text-sm">
                All Time: <span className="text-green-600 font-medium">+$4,123.45 (+20.17%)</span>
              </div>
            </div>
          </div>
          <div className="flex justify-end sm:justify-start">
            <Select>
              <SelectTrigger className="w-20 sm:w-24 h-8 text-xs">
                <SelectValue placeholder="1D" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">1D</SelectItem>
                <SelectItem value="1w">1W</SelectItem>
                <SelectItem value="1m">1M</SelectItem>
                <SelectItem value="3m">3M</SelectItem>
                <SelectItem value="1y">1Y</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Transparent Portfolio Chart - Mobile Optimized */}
      <div className="h-48 sm:h-64 relative overflow-hidden">
        <svg className="w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="none">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Portfolio trend line with smooth curve */}
          <path 
            d="M 0,150 C 80,140 120,130 200,125 S 320,115 400,105 S 520,95 600,85 S 720,75 800,65" 
            stroke="#10b981" 
            strokeWidth="3" 
            fill="none"
            filter="url(#glow)"
            className="chart-line animate-pulse"
            opacity="0.9"
          />
          
          {/* Live indicator */}
          <g className="live-dot" opacity="0.8">
            <circle cx="800" cy="65" r="4" fill="#10b981" className="animate-ping"/>
            <circle cx="800" cy="65" r="2" fill="#ffffff"/>
          </g>
        </svg>
      </div>

      {/* Buying Power Display - Green Glowing Text */}
      <div className="px-4 py-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Buying Power</span>
          <span className="text-sm font-bold text-green-500 glow-green">
            ${(50000 - portfolioValue).toLocaleString('en-US', {minimumFractionDigits: 2})}
          </span>
        </div>
      </div>

      <div className="px-4 space-y-6">

      {/* Wallet Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Crypto Holdings */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <SiBitcoin className="h-5 w-5 text-orange-500" />
              <h3 className="text-lg font-semibold text-black">Crypto Holdings</h3>
            </div>
            <div className="text-sm font-medium text-green-600">
              ${totalCrypto.toLocaleString('en-US', {minimumFractionDigits: 2})}
            </div>
          </div>
          <div className="space-y-3">
            {holdings.filter(h => ['BTC', 'ETH', 'SOL'].includes(h.symbol || '')).map((holding) => (
              <div key={holding.symbol} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {holding.symbol === 'BTC' && <SiBitcoin className="h-6 w-6 text-orange-500" />}
                  {holding.symbol === 'ETH' && <SiEthereum className="h-6 w-6 text-blue-500" />}
                  {holding.symbol === 'SOL' && <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">S</div>}
                  <div>
                    <div className="font-medium text-black">{holding.symbol}</div>
                    <div className="text-xs text-gray-500">{holding.shares} coins</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-black">
                    ${holding.value?.toLocaleString('en-US', {minimumFractionDigits: 2})}
                  </div>
                  <div className={`text-xs ${(holding.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(holding.change || 0) >= 0 ? '+' : ''}{holding.change?.toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stock Holdings */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-black">Stock Holdings</h3>
            </div>
            <div className="text-sm font-medium text-green-600">
              ${totalStocks.toLocaleString('en-US', {minimumFractionDigits: 2})}
            </div>
          </div>
          <div className="space-y-3">
            {holdings.filter(h => !['BTC', 'ETH', 'SOL'].includes(h.symbol || '')).map((holding) => (
              <div key={holding.symbol} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {holding.symbol === 'AAPL' && <SiApple className="h-6 w-6 text-gray-600" />}
                  {holding.symbol === 'TSLA' && <SiTesla className="h-6 w-6 text-red-500" />}
                  {holding.symbol === 'GOOGL' && <SiGoogle className="h-6 w-6 text-blue-500" />}
                  {holding.symbol === 'MSFT' && <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">MS</div>}
                  <div>
                    <div className="font-medium text-black">{holding.symbol}</div>
                    <div className="text-xs text-gray-500">{holding.shares} shares</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-black">
                    ${holding.value?.toLocaleString('en-US', {minimumFractionDigits: 2})}
                  </div>
                  <div className={`text-xs ${(holding.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(holding.change || 0) >= 0 ? '+' : ''}{holding.change?.toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key Portfolio Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Positions</div>
          <div className="text-xl font-bold text-black">{holdings.length}</div>
          <div className="text-xs text-gray-500 mt-1">Active Holdings</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Day's P&L</div>
          <div className={`text-xl font-bold ${todayPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {todayPL >= 0 ? '+' : ''}${todayPL.toFixed(2)}
          </div>
          <div className={`text-xs mt-1 ${todayPL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {todayPL >= 0 ? '+' : ''}{todayPLPercent}%
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Total Return</div>
          <div className="text-xl font-bold text-green-600">+$4,123.45</div>
          <div className="text-xs text-green-500 mt-1">+20.17%</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Diversity Score</div>
          <div className="text-xl font-bold text-black">8.5/10</div>
          <div className="text-xs text-green-500 mt-1">Well Diversified</div>
        </div>
      </div>

      {/* Asset Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Asset Allocation Pie Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-black mb-4">Asset Allocation</h3>
          <div className="relative h-48 flex items-center justify-center">
            {/* Simple donut chart representation */}
            <div className="relative w-32 h-32">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="20"/>
                <circle 
                  cx="60" 
                  cy="60" 
                  r="50" 
                  fill="none" 
                  stroke="#10b981" 
                  strokeWidth="20"
                  strokeDasharray={`${(totalStocks/portfolioValue) * 314} 314`}
                  strokeDashoffset="0"
                />
                <circle 
                  cx="60" 
                  cy="60" 
                  r="50" 
                  fill="none" 
                  stroke="#f59e0b" 
                  strokeWidth="20"
                  strokeDasharray={`${(totalCrypto/portfolioValue) * 314} 314`}
                  strokeDashoffset={`-${(totalStocks/portfolioValue) * 314}`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-xs text-gray-600">Total</div>
                  <div className="text-lg font-bold text-black">${(portfolioValue/1000).toFixed(0)}K</div>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-2 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Stocks</span>
              </div>
              <span className="text-sm font-medium text-black">{((totalStocks/portfolioValue) * 100).toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Crypto</span>
              </div>
              <span className="text-sm font-medium text-black">{((totalCrypto/portfolioValue) * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Holdings Overview */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-black">Holdings</h3>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Position
            </Button>
          </div>
          <div className="space-y-3">
            {holdings.slice(0, 6).map((holding, index) => {
              const getIcon = (symbol: string) => {
                switch (symbol) {
                  case 'AAPL': return <SiApple className="h-5 w-5 text-gray-600" />;
                  case 'MSFT': return <BarChart3 className="h-5 w-5 text-blue-600" />;
                  case 'TSLA': return <SiTesla className="h-5 w-5 text-red-600" />;
                  case 'GOOGL': return <SiGoogle className="h-5 w-5 text-blue-500" />;
                  case 'BTC': return <SiBitcoin className="h-5 w-5 text-orange-500" />;
                  case 'ETH': return <SiEthereum className="h-5 w-5 text-blue-400" />;
                  default: return <BarChart3 className="h-5 w-5 text-gray-600" />;
                }
              };

              return (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    {getIcon(holding.symbol)}
                    <div>
                      <div className="font-medium text-black">{holding.symbol}</div>
                      <div className="text-xs text-gray-500">{holding.shares} shares</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-black">${holding.value.toLocaleString()}</div>
                    <div className={`text-xs ${holding.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {holding.change >= 0 ? '+' : ''}{holding.change}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Button className="h-16 bg-green-600 hover:bg-green-700 text-white">
          <div className="text-center">
            <TrendingUp className="h-5 w-5 mx-auto mb-1" />
            <div className="text-sm">Buy</div>
          </div>
        </Button>
        <Button variant="outline" className="h-16">
          <div className="text-center">
            <TrendingDown className="h-5 w-5 mx-auto mb-1" />
            <div className="text-sm">Sell</div>
          </div>
        </Button>
        <Button variant="outline" className="h-16">
          <div className="text-center">
            <DollarSign className="h-5 w-5 mx-auto mb-1" />
            <div className="text-sm">Transfer</div>
          </div>
        </Button>
        <Button variant="outline" className="h-16">
          <div className="text-center">
            <Activity className="h-5 w-5 mx-auto mb-1" />
            <div className="text-sm">Analytics</div>
          </div>
        </Button>
      </div>
      </div>
    </div>
  );
}