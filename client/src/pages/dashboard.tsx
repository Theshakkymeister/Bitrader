import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Plus, DollarSign, BarChart3, PieChart, Activity, Eye, EyeOff } from "lucide-react";
import { SiApple, SiBitcoin, SiTesla, SiGoogle, SiEthereum } from "react-icons/si";
import { allAssets } from "@/lib/marketData";
import { useLocation } from "wouter";

// Portfolio performance data - starts at $0.00 for new users
const portfolioData = [
  { time: "9:30", value: 0 },
  { time: "10:00", value: 0 },
  { time: "10:30", value: 0 },
  { time: "11:00", value: 0 },
  { time: "11:30", value: 0 },
  { time: "12:00", value: 0 },
  { time: "12:30", value: 0 },
  { time: "1:00", value: 0 },
  { time: "1:30", value: 0 },
  { time: "2:00", value: 0 },
  { time: "2:30", value: 0 },
  { time: "3:00", value: 0 },
  { time: "3:30", value: 0 },
  { time: "4:00", value: 0 }
];

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [showBalance, setShowBalance] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(true);

  // Get real-time portfolio data
  const { data: portfolio } = useQuery({
    queryKey: ['/api/portfolio'],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Get user wallets data
  const { data: wallets = [] } = useQuery({
    queryKey: ['/api/wallets'],
    refetchInterval: 5000,
  });

  // Debug portfolio data
  console.log('Dashboard portfolio data:', portfolio);
  console.log('Dashboard wallets data:', wallets);

  // Calculate portfolio value from wallet data since API isn't returning calculated values
  const totalWalletValue = wallets.reduce((sum, wallet) => {
    return sum + parseFloat(wallet.usdValue || '0');
  }, 0);
  
  const portfolioValue = portfolio?.totalValue || portfolio?.walletValue || totalWalletValue;
  const balance = parseFloat(portfolio?.totalBalance || '0') || portfolioValue;
  
  console.log('Dashboard calculated values:', { portfolioValue, balance, totalWalletValue });

  // Real-time portfolio simulation - only when user has funds
  useEffect(() => {
    if (portfolioValue > 0) {
      const interval = setInterval(() => {
        setPortfolioValue(prev => {
          const change = (Math.random() - 0.5) * 10;
          const newValue = Math.max(prev + change, 0);
          return newValue;
        });
        setLastUpdate(new Date());
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [portfolioValue]);

  // Handle scroll to hide/show welcome message
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setShowWelcomeMessage(scrollY < 100); // Hide after 100px scroll
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const todayPLPercent = portfolio?.todayPL || 0;
  const todayPL = portfolioValue * (todayPLPercent / 100);

  // Holdings data - Real data from portfolio
  const getHolding = (symbol: string, shares: number) => {
    const asset = allAssets.find(a => a.symbol === symbol);
    if (!asset) return null;
    
    // Find actual wallet balance if it's a crypto
    const wallet = wallets.find((w: any) => w.symbol === symbol);
    const actualValue = wallet ? parseFloat(wallet.usdValue || '0') : 0;
    
    return {
      ...asset,
      shares: wallet ? parseFloat(wallet.balance || '0') : 0,
      value: actualValue
    };
  };

  const holdings = [
    getHolding('AAPL', 0),
    getHolding('MSFT', 0),
    getHolding('TSLA', 0),
    getHolding('GOOGL', 0),
    getHolding('BTC', 0),
    getHolding('ETH', 0),
    getHolding('SOL', 0)
  ].filter(h => h !== null);

  const totalStocks = holdings.filter(h => !['BTC', 'ETH', 'SOL'].includes(h.symbol)).reduce((sum, h) => sum + h.value, 0);
  const totalCrypto = holdings.filter(h => ['BTC', 'ETH', 'SOL'].includes(h.symbol)).reduce((sum, h) => sum + h.value, 0);
  
  // Calculate available buying power from real wallet balances
  const buyingPower = totalWalletValue; // Available balance for trading
  
  return (
    <div className="space-y-6 fade-in">
      {/* Main Portfolio Header */}
      <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200 p-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-sm text-gray-600 mb-1">Total Portfolio Value</div>
            <div className="text-4xl font-bold text-black mb-2">
              ${portfolioValue.toLocaleString('en-US', {minimumFractionDigits: 2})}
            </div>
            <div className="flex items-center text-sm space-x-4">
              {portfolioValue > 0 ? (
                <>
                  <div className="flex items-center">
                    <span className={`font-medium ${todayPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {todayPL >= 0 ? '+' : ''}${todayPL.toLocaleString('en-US', {minimumFractionDigits: 2})}
                    </span>
                    <span className={`ml-1 ${todayPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ({todayPL >= 0 ? '+' : ''}{todayPLPercent}%) Today
                    </span>
                  </div>
                  <div className="text-gray-600">
                    All Time: <span className="text-green-600 font-medium">+$0.00 (+0.00%)</span>
                  </div>
                </>
              ) : null}
            </div>
          </div>
          <div className="text-right">
            <Select>
              <SelectTrigger className="w-24 h-8 text-xs">
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

      {/* Portfolio Chart - Robinhood Style */}
      <div className="h-48 bg-white relative overflow-hidden rounded-lg border border-gray-200 mx-2">
        <svg className="w-full h-full" viewBox="0 0 600 160" preserveAspectRatio="none">
          <defs>
            <linearGradient id="portfolioGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#059669" stopOpacity="0.08"/>
              <stop offset="50%" stopColor="#059669" stopOpacity="0.04"/>
              <stop offset="100%" stopColor="#059669" stopOpacity="0"/>
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {portfolioValue > 0 ? (
            <>
              {/* Portfolio trend line with smooth curve */}
              <path 
                d="M 20,120 C 80,110 120,100 200,95 S 320,85 400,80 S 480,75 560,70" 
                stroke="#059669" 
                strokeWidth="2" 
                fill="none"
                filter="url(#glow)"
                className="chart-line"
                strokeDasharray="1000"
                strokeDashoffset="0"
                opacity="0.8"
              />
              
              {/* Filled area under curve */}
              <path 
                d="M 20,120 C 80,110 120,100 200,95 S 320,85 400,80 S 480,75 560,70 L 560,160 L 20,160 Z" 
                fill="url(#portfolioGradient)"
                className="chart-fill"
                style={{ opacity: 1 }}
              />
              
              {/* Live indicator */}
              <g className="live-dot" opacity="0.6">
                <circle cx="560" cy="70" r="4" fill="#059669" opacity="0.1">
                  <animate attributeName="r" values="4;8;4" dur="3s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.1;0;0.1" dur="3s" repeatCount="indefinite"/>
                </circle>
                <circle cx="560" cy="70" r="2" fill="#059669" opacity="0.8">
                  <animate attributeName="r" values="2;3;2" dur="2s" repeatCount="indefinite"/>
                </circle>
                <circle cx="560" cy="70" r="1.5" fill="#ffffff"/>
              </g>
            </>
          ) : (
            <>
              {/* Flat line for empty portfolio */}
              <path 
                d="M 20,80 L 560,80" 
                stroke="#9CA3AF" 
                strokeWidth="2" 
                fill="none"
                opacity="0.5"
                strokeDasharray="5,5"
              />
              <text x="300" y="100" textAnchor="middle" className="fill-gray-400 text-sm">
                Portfolio chart will appear after your first deposit
              </text>
            </>
          )}
        </svg>
      </div>

      {/* Buying Power Display - Robinhood Style */}
      <div className="px-4 py-2 bg-gray-50/30">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Buying Power</span>
          <span className={`text-sm font-semibold ${buyingPower > 0 ? 'text-green-600 glow-green' : 'text-gray-600'}`}>
            ${buyingPower.toLocaleString('en-US', {minimumFractionDigits: 2})}
          </span>
        </div>
        {buyingPower === 0 && (
          <div className="mt-2 text-xs text-gray-500">
            💰 Deposit funds via Wallets to increase buying power
          </div>
        )}
      </div>

      {/* Wallet Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Crypto Wallet */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <SiBitcoin className="h-6 w-6 text-orange-500" />
              <h3 className="text-lg font-semibold text-gray-900">Crypto Wallet</h3>
            </div>
            <div className="text-sm font-medium text-green-600">
              ${totalWalletValue.toLocaleString('en-US', {minimumFractionDigits: 2})}
            </div>
          </div>
          <div className="space-y-3">
            {holdings.filter(h => ['BTC', 'ETH', 'SOL'].includes(h.symbol || '')).map((holding) => (
              <div key={holding.symbol} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-3">
                  {holding.symbol === 'BTC' && <SiBitcoin className="h-8 w-8 text-orange-500" />}
                  {holding.symbol === 'ETH' && <SiEthereum className="h-8 w-8 text-blue-500" />}
                  {holding.symbol === 'SOL' && <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">S</div>}
                  <div>
                    <div className="font-medium text-gray-900">{holding.symbol}</div>
                    <div className="text-sm text-gray-500">{holding.shares?.toFixed(4)} coins</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">
                    ${holding.value?.toLocaleString('en-US', {minimumFractionDigits: 2})}
                  </div>
                  <div className={`text-sm ${(holding.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(holding.change || 0) >= 0 ? '+' : ''}{holding.change?.toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stock Portfolio */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-6 w-6 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-900">Stock Portfolio</h3>
            </div>
            <div className="text-sm font-medium text-green-600">
              ${totalStocks.toLocaleString('en-US', {minimumFractionDigits: 2})}
            </div>
          </div>
          <div className="space-y-3">
            {holdings.filter(h => !['BTC', 'ETH', 'SOL'].includes(h.symbol || '')).map((holding) => (
              <div key={holding.symbol} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-3">
                  {holding.symbol === 'AAPL' && <SiApple className="h-8 w-8 text-gray-700" />}
                  {holding.symbol === 'TSLA' && <SiTesla className="h-8 w-8 text-red-500" />}
                  {holding.symbol === 'GOOGL' && <SiGoogle className="h-8 w-8 text-blue-500" />}
                  {holding.symbol === 'MSFT' && <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white text-sm font-bold">MS</div>}
                  <div>
                    <div className="font-medium text-gray-900">{holding.symbol}</div>
                    <div className="text-sm text-gray-500">{holding.shares} shares</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">
                    ${holding.value?.toLocaleString('en-US', {minimumFractionDigits: 2})}
                  </div>
                  <div className={`text-sm ${(holding.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
          <div className="text-xl font-bold text-black">{portfolioValue === 0 ? 0 : holdings.length}</div>
          <div className="text-xs text-gray-500 mt-1">Active Holdings</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Day's P&L</div>
          <div className="text-xl font-bold text-gray-600">$0.00</div>
          <div className="text-xs mt-1 text-gray-600">0.00%</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow duration-300">
          <div className="flex justify-between items-start mb-2">
            <div className="text-xs text-gray-600 uppercase tracking-wide">Total Return</div>
            <div className="text-xs text-gray-500 font-medium">All Time</div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-gray-600">$0.00</div>
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600 font-medium">0.00%</div>
              <div className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded-full">
                {portfolioValue === 0 ? 'No Growth Yet' : 'Portfolio Growth'}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Diversity Score</div>
          <div className="text-xl font-bold text-black">{portfolioValue === 0 ? '0/10' : '8.5/10'}</div>
          <div className="text-xs text-gray-500 mt-1">{portfolioValue === 0 ? 'No Holdings' : 'Well Diversified'}</div>
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
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setLocation("/trading")}
              className="hover:bg-green-50 hover:border-green-200 hover:text-green-700 transition-colors"
            >
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

      {/* Welcome Message - Bottom Right */}
      {portfolioValue === 0 && (
        <div 
          className={`fixed bottom-4 right-4 bg-blue-50 rounded-lg p-3 border border-blue-200 shadow-lg max-w-xs z-50 transition-all duration-500 ease-in-out ${
            showWelcomeMessage 
              ? 'opacity-100 transform translate-y-0' 
              : 'opacity-0 transform translate-y-4 pointer-events-none'
          }`}
        >
          <p className="text-xs text-blue-700 font-medium">Welcome to Live Trading!</p>
          <p className="text-xs text-blue-600 mt-1">
            Deposit funds via Wallets to start trading.
          </p>
        </div>
      )}
    </div>
  );
}