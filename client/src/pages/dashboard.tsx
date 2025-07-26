import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConnectAccount } from "@/components/connect-account";
import { 
  Wallet, 
  TrendingUp, 
  Target, 
  Bot, 
  Download,
  Coins,
  Gem,
  BarChart3,
  Bitcoin,
  Headphones,
  Settings,
  History,
  ChartLine,
  Plus,
  Menu,
  X,
  HelpCircle,
  Shield,
  Copy
} from "lucide-react";
import type { Portfolio, Trade, PerformanceMetric } from "@shared/schema";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false); // Default closed on mobile
  const [activeView, setActiveView] = useState('dashboard');
  const [buyStockDialog, setBuyStockDialog] = useState(false);
  const [buyCryptoDialog, setBuyCryptoDialog] = useState(false);
  const [adminDialog, setAdminDialog] = useState(false);
  const [selectedStock, setSelectedStock] = useState('');
  const [selectedCrypto, setSelectedCrypto] = useState('');
  const [depositAddresses, setDepositAddresses] = useState({
    btc: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    eth: '0x742d35Cc6634C0532925a3b8D73C6d3D8f4b1234',
    sol: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    usdt: '0x742d35Cc6634C0532925a3b8D73C6d3D8f4b1234'
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: portfolio, isLoading: portfolioLoading } = useQuery<Portfolio>({
    queryKey: ["/api/portfolio"],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: trades = [], isLoading: tradesLoading } = useQuery<Trade[]>({
    queryKey: ["/api/trades"],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: algorithms = [], isLoading: algorithmsLoading } = useQuery({
    queryKey: ["/api/algorithms"],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: performance = [] } = useQuery<PerformanceMetric[]>({
    queryKey: ["/api/performance"],
    enabled: isAuthenticated,
    retry: false,
  });

  if (isLoading || portfolioLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const getUserInitials = (user: any) => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  const getUserName = (user: any) => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return "User";
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Clean Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-6">
            <h1 className="text-xl font-bold text-black">
              Bitrader
            </h1>
            <nav className="hidden md:flex space-x-8">
              <button 
                onClick={() => setActiveView('dashboard')}
                className={`text-sm font-medium transition-colors ${
                  activeView === 'dashboard' ? 'text-black' : 'text-gray-600 hover:text-black'
                }`}
              >
                Dashboard
              </button>
              <button 
                onClick={() => setActiveView('stocks')}
                className={`text-sm font-medium transition-colors ${
                  activeView === 'stocks' ? 'text-black' : 'text-gray-600 hover:text-black'
                }`}
              >
                Stocks
              </button>
              <button 
                onClick={() => setActiveView('crypto')}
                className={`text-sm font-medium transition-colors ${
                  activeView === 'crypto' ? 'text-black' : 'text-gray-600 hover:text-black'
                }`}
              >
                Crypto
              </button>
              <button 
                onClick={() => setActiveView('wallet')}
                className={`text-sm font-medium transition-colors ${
                  activeView === 'wallet' ? 'text-black' : 'text-gray-600 hover:text-black'
                }`}
              >
                Wallet
              </button>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            {/* Admin Button for authorized users */}
            {user?.email === '5k7whkfvpw@private.replit.com' && (
              <Dialog open={adminDialog} onOpenChange={setAdminDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="hidden md:flex pulse-glow">
                    <Shield className="h-4 w-4 mr-2" />
                    Admin
                  </Button>
                </DialogTrigger>
                <DialogContent className="smooth-enter">
                  <DialogHeader>
                    <DialogTitle>Admin Panel - Manage Deposit Addresses</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="btc-address">Bitcoin (BTC) Address</Label>
                      <Input
                        id="btc-address"
                        value={depositAddresses.btc}
                        onChange={(e) => setDepositAddresses(prev => ({ ...prev, btc: e.target.value }))}
                        placeholder="Enter BTC address"
                      />
                    </div>
                    <div>
                      <Label htmlFor="eth-address">Ethereum (ETH) Address</Label>
                      <Input
                        id="eth-address"
                        value={depositAddresses.eth}
                        onChange={(e) => setDepositAddresses(prev => ({ ...prev, eth: e.target.value }))}
                        placeholder="Enter ETH address"
                      />
                    </div>
                    <div>
                      <Label htmlFor="sol-address">Solana (SOL) Address</Label>
                      <Input
                        id="sol-address"
                        value={depositAddresses.sol}
                        onChange={(e) => setDepositAddresses(prev => ({ ...prev, sol: e.target.value }))}
                        placeholder="Enter SOL address"
                      />
                    </div>
                    <div>
                      <Label htmlFor="usdt-address">Tether (USDT) Address</Label>
                      <Input
                        id="usdt-address"
                        value={depositAddresses.usdt}
                        onChange={(e) => setDepositAddresses(prev => ({ ...prev, usdt: e.target.value }))}
                        placeholder="Enter USDT address"
                      />
                    </div>
                    <Button 
                      onClick={() => {
                        toast({
                          title: "Success",
                          description: "Deposit addresses updated successfully!",
                        });
                        setAdminDialog(false);
                      }}
                      className="w-full bg-green-500 hover:bg-green-600"
                    >
                      Save Changes
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-white">{getUserInitials(user)}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Mobile Sidebar */}
      <aside className={`${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } fixed top-0 left-0 z-50 w-64 h-full bg-white border-r border-gray-200 transform transition-transform duration-300 md:hidden`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-black">Menu</h2>
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <nav className="p-4 space-y-2">
          <button 
            onClick={() => { setActiveView('dashboard'); setSidebarOpen(false); }}
            className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
              activeView === 'dashboard' ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => { setActiveView('stocks'); setSidebarOpen(false); }}
            className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
              activeView === 'stocks' ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            Stock Holdings
          </button>
          <button 
            onClick={() => { setActiveView('crypto'); setSidebarOpen(false); }}
            className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
              activeView === 'crypto' ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            Crypto Holdings
          </button>
          <button 
            onClick={() => { setActiveView('wallet'); setSidebarOpen(false); }}
            className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
              activeView === 'wallet' ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            Wallet
          </button>
          <button 
            onClick={() => { setActiveView('trades'); setSidebarOpen(false); }}
            className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
              activeView === 'trades' ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            History
          </button>
          <button 
            onClick={() => { setActiveView('settings'); setSidebarOpen(false); }}
            className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
              activeView === 'settings' ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            Settings
          </button>
          <div className="border-t border-gray-200 pt-4 mt-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => window.location.href = '/api/logout'}
              className="w-full text-left justify-start text-gray-600 hover:text-black"
            >
              Sign Out
            </Button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {portfolioLoading || tradesLoading || algorithmsLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        ) : (
          renderActiveView()
        )}
      </main>
    </div>
  );

  function renderActiveView() {
    switch (activeView) {
      case 'dashboard':
        return renderDashboard();
      case 'stocks':
        return renderStocks();
      case 'crypto':
        return renderCrypto();
      case 'wallet':
        return renderWallet();
      case 'trades':
        return renderTrades();
      case 'settings':
        return renderSettings();
      default:
        return renderDashboard();
    }
  }

  function renderDashboard() {
    return (
      <div className="space-y-6 fade-in">
        {/* Portfolio Value Card with Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 hover-scale transition-all duration-300 smooth-enter">
          <div className="flex justify-between items-start mb-4">
            <div className="slide-in-left">
              <div className="text-sm text-gray-600 mb-1">Portfolio Value</div>
              <div className="text-3xl font-bold text-black mb-2 bounce-in">
                ${portfolio?.totalBalance ? parseFloat(portfolio.totalBalance).toLocaleString('en-US', {minimumFractionDigits: 2}) : '0.00'}
              </div>
              <div className="flex items-center text-sm">
                <span className="text-green-600 font-medium pulse-glow">+${portfolio?.todayPL ? parseFloat(portfolio.todayPL).toLocaleString('en-US', {minimumFractionDigits: 2}) : '0.00'}</span>
                <span className="text-gray-600 ml-1">(+1.97%) Today</span>
              </div>
            </div>
            <div className="slide-in-right">
              <Select>
                <SelectTrigger className="w-24 h-8 text-xs hover-glow">
                  <SelectValue placeholder="1D" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">1D</SelectItem>
                  <SelectItem value="1w">1W</SelectItem>
                  <SelectItem value="1m">1M</SelectItem>
                  <SelectItem value="1y">1Y</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Animated Portfolio Chart */}
          <div className="h-32 bg-gray-50 rounded-lg flex items-center justify-center relative overflow-hidden hover-glow transition-all duration-300">
            <svg className="w-full h-full" viewBox="0 0 400 100">
              <path 
                d="M 0,80 Q 100,60 200,45 T 400,20" 
                stroke="#10b981" 
                strokeWidth="2" 
                fill="none"
                className="animate-pulse"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.3"/>
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0"/>
                </linearGradient>
              </defs>
              <path 
                d="M 0,80 Q 100,60 200,45 T 400,20 L 400,100 L 0,100 Z" 
                fill="url(#gradient)"
              />
            </svg>
          </div>
        </div>

        {/* Buying Power and Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4 hover-scale transition-all duration-300 smooth-enter" style={{animationDelay: '0.1s'}}>
            <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Buying Power</div>
            <div className="text-xl font-bold text-black bounce-in">$15,420.00</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 hover-scale transition-all duration-300 smooth-enter" style={{animationDelay: '0.2s'}}>
            <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Active Positions</div>
            <div className="text-xl font-bold text-black bounce-in">8</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 hover-scale transition-all duration-300 smooth-enter" style={{animationDelay: '0.3s'}}>
            <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Day's Return</div>
            <div className="text-xl font-bold text-green-600 bounce-in pulse-glow">+2.45%</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 hover-scale transition-all duration-300 smooth-enter" style={{animationDelay: '0.4s'}}>
            <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Total Return</div>
            <div className="text-xl font-bold text-green-600 bounce-in pulse-glow">+18.7%</div>
          </div>
        </div>

        {/* Holdings Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Stock Holdings */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-black mb-4">Stock Holdings</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-xs font-bold text-blue-600">AAPL</span>
                  </div>
                  <span className="font-medium">Apple Inc.</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">$2,450.00</div>
                  <div className="text-xs text-green-600">+1.2%</div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-xs font-bold text-green-600">TSLA</span>
                  </div>
                  <span className="font-medium">Tesla Inc.</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">$1,875.00</div>
                  <div className="text-xs text-red-600">-0.8%</div>
                </div>
              </div>
            </div>
          </div>

          {/* Crypto Holdings */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-black mb-4">Crypto Holdings</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                    <Bitcoin className="h-4 w-4 text-orange-600" />
                  </div>
                  <span className="font-medium">Bitcoin</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">$8,750.00</div>
                  <div className="text-xs text-green-600">+3.5%</div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-xs font-bold text-purple-600">ETH</span>
                  </div>
                  <span className="font-medium">Ethereum</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">$3,200.00</div>
                  <div className="text-xs text-green-600">+2.1%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }



  function renderStocks() {
    return (
      <div className="space-y-6 fade-in">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-black slide-in-left">Stock Holdings</h2>
          <Dialog open={buyStockDialog} onOpenChange={setBuyStockDialog}>
            <DialogTrigger asChild>
              <Button className="bg-green-500 hover:bg-green-600 text-white hover-scale transition-all duration-300 pulse-glow">
                Buy Stocks
              </Button>
            </DialogTrigger>
            <DialogContent className="smooth-enter">
              <DialogHeader>
                <DialogTitle>Buy Stocks</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="stock-symbol">Stock Symbol</Label>
                  <Select value={selectedStock} onValueChange={setSelectedStock}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a stock" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AAPL">AAPL - Apple Inc.</SelectItem>
                      <SelectItem value="TSLA">TSLA - Tesla Inc.</SelectItem>
                      <SelectItem value="MSFT">MSFT - Microsoft Corp.</SelectItem>
                      <SelectItem value="GOOGL">GOOGL - Alphabet Inc.</SelectItem>
                      <SelectItem value="AMZN">AMZN - Amazon.com Inc.</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="shares">Number of Shares</Label>
                  <Input id="shares" type="number" placeholder="Enter number of shares" />
                </div>
                <Button 
                  onClick={() => {
                    toast({
                      title: "Order Placed",
                      description: `Successfully placed order to buy ${selectedStock}`,
                    });
                    setBuyStockDialog(false);
                  }}
                  className="w-full bg-green-500 hover:bg-green-600"
                  disabled={!selectedStock}
                >
                  Place Order
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="text-sm font-medium text-black">My Positions</div>
          </div>
          <div className="divide-y divide-gray-200">
            <div className="p-4 hover:bg-gray-50 cursor-pointer">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-sm font-bold text-blue-600">AAPL</span>
                  </div>
                  <div>
                    <div className="font-medium text-black">Apple Inc.</div>
                    <div className="text-sm text-gray-600">12 shares</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-black">$2,450.00</div>
                  <div className="text-sm text-green-600">+$29.40 (+1.2%)</div>
                </div>
              </div>
            </div>
            
            <div className="p-4 hover:bg-gray-50 cursor-pointer">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-sm font-bold text-green-600">TSLA</span>
                  </div>
                  <div>
                    <div className="font-medium text-black">Tesla Inc.</div>
                    <div className="text-sm text-gray-600">8 shares</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-black">$1,875.00</div>
                  <div className="text-sm text-red-600">-$15.20 (-0.8%)</div>
                </div>
              </div>
            </div>

            <div className="p-4 hover:bg-gray-50 cursor-pointer">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-sm font-bold text-purple-600">MSFT</span>
                  </div>
                  <div>
                    <div className="font-medium text-black">Microsoft Corp.</div>
                    <div className="text-sm text-gray-600">6 shares</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-black">$2,100.00</div>
                  <div className="text-sm text-green-600">+$42.00 (+2.0%)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderCrypto() {
    return (
      <div className="space-y-6 fade-in">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-black slide-in-left">Crypto Holdings</h2>
          <Dialog open={buyCryptoDialog} onOpenChange={setBuyCryptoDialog}>
            <DialogTrigger asChild>
              <Button className="bg-green-500 hover:bg-green-600 text-white hover-scale transition-all duration-300 pulse-glow">
                Buy Crypto
              </Button>
            </DialogTrigger>
            <DialogContent className="smooth-enter">
              <DialogHeader>
                <DialogTitle>Buy Cryptocurrency</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="crypto-symbol">Cryptocurrency</Label>
                  <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a cryptocurrency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                      <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                      <SelectItem value="SOL">Solana (SOL)</SelectItem>
                      <SelectItem value="USDT">Tether (USDT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="amount">Amount (USD)</Label>
                  <Input id="amount" type="number" placeholder="Enter amount in USD" />
                </div>
                <Button 
                  onClick={() => {
                    toast({
                      title: "Order Placed",
                      description: `Successfully placed order to buy ${selectedCrypto}`,
                    });
                    setBuyCryptoDialog(false);
                  }}
                  className="w-full bg-green-500 hover:bg-green-600"
                  disabled={!selectedCrypto}
                >
                  Place Order
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="text-sm font-medium text-black">My Crypto Portfolio</div>
          </div>
          <div className="divide-y divide-gray-200">
            <div className="p-4 hover:bg-gray-50 cursor-pointer">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-4">
                    <Bitcoin className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="font-medium text-black">Bitcoin</div>
                    <div className="text-sm text-gray-600">0.1854 BTC</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-black">$8,750.00</div>
                  <div className="text-sm text-green-600">+$298.25 (+3.5%)</div>
                </div>
              </div>
            </div>
            
            <div className="p-4 hover:bg-gray-50 cursor-pointer">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-sm font-bold text-purple-600">ETH</span>
                  </div>
                  <div>
                    <div className="font-medium text-black">Ethereum</div>
                    <div className="text-sm text-gray-600">1.24 ETH</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-black">$3,200.00</div>
                  <div className="text-sm text-green-600">+$65.80 (+2.1%)</div>
                </div>
              </div>
            </div>

            <div className="p-4 hover:bg-gray-50 cursor-pointer">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-sm font-bold text-blue-600">SOL</span>
                  </div>
                  <div>
                    <div className="font-medium text-black">Solana</div>
                    <div className="text-sm text-gray-600">45.2 SOL</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-black">$1,580.00</div>
                  <div className="text-sm text-green-600">+$78.40 (+5.2%)</div>
                </div>
              </div>
            </div>

            <div className="p-4 hover:bg-gray-50 cursor-pointer">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-xs font-bold text-green-600">USDT</span>
                  </div>
                  <div>
                    <div className="font-medium text-black">Tether</div>
                    <div className="text-sm text-gray-600">2,450 USDT</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-black">$2,450.00</div>
                  <div className="text-sm text-gray-600">$0.00 (0.0%)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderWallet() {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-black">Wallet</h2>
        
        {/* Balance Overview */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">Available Cash</div>
            <div className="text-3xl font-bold text-black mb-4">$15,420.00</div>
            <Button className="bg-green-500 hover:bg-green-600 text-white">
              Add Money
            </Button>
          </div>
        </div>

        {/* Crypto Deposit Options */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="text-lg font-medium text-black">Deposit Cryptocurrencies</div>
            <div className="text-sm text-gray-600">Send crypto to your Bitrader wallet</div>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Bitcoin Deposit */}
              <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer hover-scale transition-all duration-300">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                    <Bitcoin className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="font-medium text-black">Bitcoin (BTC)</div>
                    <div className="text-sm text-gray-600">Network: Bitcoin</div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full hover-scale transition-all duration-300"
                  onClick={() => {
                    navigator.clipboard.writeText(depositAddresses.btc);
                    toast({
                      title: "Address Copied",
                      description: "Bitcoin deposit address copied to clipboard",
                    });
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Address
                </Button>
              </div>

              {/* Ethereum Deposit */}
              <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer hover-scale transition-all duration-300">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-bold text-purple-600">ETH</span>
                  </div>
                  <div>
                    <div className="font-medium text-black">Ethereum (ETH)</div>
                    <div className="text-sm text-gray-600">Network: Ethereum</div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full hover-scale transition-all duration-300"
                  onClick={() => {
                    navigator.clipboard.writeText(depositAddresses.eth);
                    toast({
                      title: "Address Copied",
                      description: "Ethereum deposit address copied to clipboard",
                    });
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Address
                </Button>
              </div>

              {/* Solana Deposit */}
              <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer hover-scale transition-all duration-300">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-bold text-blue-600">SOL</span>
                  </div>
                  <div>
                    <div className="font-medium text-black">Solana (SOL)</div>
                    <div className="text-sm text-gray-600">Network: Solana</div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full hover-scale transition-all duration-300"
                  onClick={() => {
                    navigator.clipboard.writeText(depositAddresses.sol);
                    toast({
                      title: "Address Copied",
                      description: "Solana deposit address copied to clipboard",
                    });
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Address
                </Button>
              </div>

              {/* USDT Deposit */}
              <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer hover-scale transition-all duration-300">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-xs font-bold text-green-600">USDT</span>
                  </div>
                  <div>
                    <div className="font-medium text-black">Tether (USDT)</div>
                    <div className="text-sm text-gray-600">Network: Ethereum</div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full hover-scale transition-all duration-300"
                  onClick={() => {
                    navigator.clipboard.writeText(depositAddresses.usdt);
                    toast({
                      title: "Address Copied",
                      description: "USDT deposit address copied to clipboard",
                    });
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Address
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="text-lg font-medium text-black">Recent Transactions</div>
          </div>
          <div className="p-4">
            <div className="text-center text-gray-600 py-8">
              No transactions yet. Make your first deposit to get started.
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderTrades() {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-black">Trade History</h2>
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="text-sm font-medium text-black">Recent Trades</div>
          </div>
          <div className="p-4">
            <div className="text-center text-gray-600 py-8">
              No trades found. Connect your Bitraders.net account to view your trading history.
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderSettings() {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-black">Settings</h2>
        <ConnectAccount 
          user={user} 
          onConnectionSuccess={() => {
            toast({
              title: "Success",
              description: "Your account has been connected successfully!",
            });
          }}
        />
      </div>
    );
  }
} 
