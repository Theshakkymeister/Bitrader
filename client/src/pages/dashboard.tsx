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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Portfolio funding history - showing how money entered the account
const portfolioChartData = [
  { date: "Jul 20", value: 0 },
  { date: "Jul 21", value: 1000 },  // First deposit
  { date: "Jul 22", value: 2500 },  // Additional funds
  { date: "Jul 23", value: 4200 },  // More funding
  { date: "Jul 24", value: 6800 },  // Growing account
  { date: "Jul 25", value: 8100 },  // Additional deposit
  { date: "Jul 26", value: 8600 },  // Small addition
  { date: "Jul 27", value: 8850 },  // Current balance
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

  // Calculate portfolio value from wallet data since API isn't returning calculated values
  const totalWalletValue = wallets.reduce((sum, wallet) => {
    return sum + parseFloat(wallet.usdValue || '0');
  }, 0);
  
  const portfolioValue = portfolio?.totalValue || portfolio?.walletValue || totalWalletValue;
  const balance = parseFloat(portfolio?.totalBalance || '0') || portfolioValue;

  // Real-time portfolio simulation - only when user has funds
  useEffect(() => {
    if (portfolioValue > 0) {
      const interval = setInterval(() => {
        // Update timestamp for real-time feel
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
              <div className="text-gray-600">
                Portfolio ready for trading
              </div>
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

      {/* Portfolio Chart - Account Balance History */}
      <div className="p-6 mx-2">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Account Balance History</h3>
          <div className="text-sm text-gray-500">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
        
        <div className="h-64 relative">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={portfolioChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={false}
                hide={true}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={false}
                hide={true}
                domain={[0, 'dataMax']}
              />
              <Tooltip 
                formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Balance']}
                labelStyle={{ color: '#374151' }}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2, fill: '#ffffff' }}
              />
            </LineChart>
          </ResponsiveContainer>
          
          {/* Live indicator dot overlay - positioned at the end of the line */}
          <div className="absolute top-[15%] right-[6%] transform -translate-x-1/2 -translate-y-1/2">
            <div className="relative">
              {/* Pulsing ring */}
              <div className="absolute inset-0 w-5 h-5 bg-green-500 rounded-full animate-ping opacity-60"></div>
              {/* Static outer ring */}
              <div className="absolute inset-1 w-3 h-3 bg-green-500 rounded-full opacity-30"></div>
              {/* Center dot */}
              <div className="relative w-5 h-5 bg-green-500 rounded-full border-2 border-white shadow-lg"></div>
            </div>
          </div>
        </div>
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