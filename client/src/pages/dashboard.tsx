import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
  Copy,
  Activity,
  Play,
  Square,
  DollarSign,
  ChevronDown,
  ChevronRight,
  Search
} from "lucide-react";
import type { Portfolio, Trade, PerformanceMetric } from "@shared/schema";
import { allAssets, getAssetsByType, searchAssets, type MarketAsset } from "@/lib/marketData";

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
  const [liveTrading, setLiveTrading] = useState(false);
  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false);
  const [mobileWalletExpanded, setMobileWalletExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cryptoAssets, setCryptoAssets] = useState<MarketAsset[]>(getAssetsByType('crypto'));
  const [stockAssets, setStockAssets] = useState<MarketAsset[]>(getAssetsByType('stock'));
  const [filteredCryptos, setFilteredCryptos] = useState<MarketAsset[]>(cryptoAssets.slice(0, 20));
  const [filteredStocks, setFilteredStocks] = useState<MarketAsset[]>(stockAssets.slice(0, 20));
  const [liveAssets, setLiveAssets] = useState(allAssets);
  
  const queryClient = useQueryClient();
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

  // Real-time price updates simulation
  useEffect(() => {
    const updatePrices = () => {
      setLiveAssets(prevAssets => 
        prevAssets.map(asset => {
          // Simulate price changes between -5% to +5%
          const changePercent = (Math.random() - 0.5) * 10; // -5% to +5%
          const newPrice = Math.max(0.01, asset.price * (1 + changePercent / 100));
          const newChange = asset.change + (changePercent * 0.1); // Accumulate change
          
          return {
            ...asset,
            price: parseFloat(newPrice.toFixed(4)),
            change: parseFloat(newChange.toFixed(2))
          };
        })
      );
    };

    const interval = setInterval(updatePrices, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Live trading mutations
  const placeTradeMutation = useMutation({
    mutationFn: async (tradeData: any) => {
      return await apiRequest('/api/trades', 'POST', tradeData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trades'] });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio'] });
      toast({
        title: "Trade Executed",
        description: "Your live trade has been placed successfully!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Trade Failed",
        description: "Unable to place trade. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Search functionality
  useEffect(() => {
    const liveCryptos = liveAssets.filter(asset => asset.type === 'crypto');
    const liveStocks = liveAssets.filter(asset => asset.type === 'stock');
    
    if (searchQuery.trim() === '') {
      setFilteredCryptos(liveCryptos.slice(0, 20));
      setFilteredStocks(liveStocks.slice(0, 20));
    } else {
      const crypto = liveCryptos.filter(asset => 
        asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.name.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 20);
      const stocks = liveStocks.filter(asset => 
        asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.name.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 20);
      setFilteredCryptos(crypto);
      setFilteredStocks(stocks);
    }
  }, [searchQuery, liveAssets]);

  // Real-time market data updates
  useEffect(() => {
    if (liveTrading) {
      const interval = setInterval(() => {
        const updateAssets = (assets: MarketAsset[]) => 
          assets.map(asset => ({
            ...asset,
            price: Math.max(0.01, asset.price * (1 + (Math.random() - 0.5) * 0.004)),
            change: asset.change + (Math.random() - 0.5) * 0.5
          }));

        setCryptoAssets(prev => updateAssets(prev));
        setStockAssets(prev => updateAssets(prev));
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [liveTrading]);

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
              <DropdownMenu open={walletDropdownOpen} onOpenChange={setWalletDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <button 
                    className={`flex items-center text-sm font-medium transition-colors ${
                      activeView === 'wallet' || activeView === 'stocks' || activeView === 'crypto' ? 'text-black' : 'text-gray-600 hover:text-black'
                    }`}
                  >
                    Wallet
                    <ChevronDown className="ml-1 h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => { setActiveView('stocks'); setWalletDropdownOpen(false); }}>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Stock Holdings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setActiveView('crypto'); setWalletDropdownOpen(false); }}>
                    <Bitcoin className="mr-2 h-4 w-4" />
                    Crypto Holdings
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <button 
                onClick={() => setActiveView('trade')}
                className={`text-sm font-medium transition-colors ${
                  activeView === 'trade' ? 'text-black' : 'text-gray-600 hover:text-black'
                }`}
              >
                Trade
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
            {(user as any)?.email === '5k7whkfvpw@private.replit.com' && (
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
              activeView === 'dashboard' ? 'bg-green-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            Dashboard
          </button>

          <div>
            <button 
              onClick={() => setMobileWalletExpanded(!mobileWalletExpanded)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium ${
                activeView === 'wallet' || activeView === 'stocks' || activeView === 'crypto' ? 'bg-green-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>Wallet</span>
              <ChevronRight className={`h-4 w-4 transition-transform ${mobileWalletExpanded ? 'rotate-90' : ''}`} />
            </button>
            {mobileWalletExpanded && (
              <div className="ml-4 mt-1 space-y-1">
                <button 
                  onClick={() => { setActiveView('stocks'); setSidebarOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                    activeView === 'stocks' ? 'bg-green-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Stock Holdings
                </button>
                <button 
                  onClick={() => { setActiveView('crypto'); setSidebarOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                    activeView === 'crypto' ? 'bg-green-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Crypto Holdings
                </button>
              </div>
            )}
          </div>
          <button 
            onClick={() => { setActiveView('trades'); setSidebarOpen(false); }}
            className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
              activeView === 'trades' ? 'bg-green-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            History
          </button>
          <button 
            onClick={() => { setActiveView('settings'); setSidebarOpen(false); }}
            className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
              activeView === 'settings' ? 'bg-green-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
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
      case 'trade':
        return renderTrade();
      case 'trades':
        return renderTrades();
      case 'settings':
        return renderSettings();
      default:
        return renderDashboard();
    }
  }





  function renderDashboard() {
    const portfolioValue = portfolio?.totalBalance ? parseFloat(portfolio.totalBalance) : 24567.89;
    const todayPL = portfolio?.todayPL ? parseFloat(portfolio.todayPL) : 432.10;
    const todayPLPercent = ((todayPL / portfolioValue) * 100).toFixed(2);
    
    // Get real market data for holdings
    const portfolioSymbols = ['AAPL', 'MSFT', 'TSLA', 'GOOGL', 'BTC', 'ETH', 'SOL'];
    const marketData = portfolioSymbols.map(symbol => {
      const asset = liveAssets.find(a => a.symbol === symbol);
      return asset || { symbol, name: symbol, price: 0, change: 0, type: 'stock', logo: '' };
    });
    
    const holdings = [
      { ...marketData.find(a => a.symbol === 'AAPL'), shares: 32, value: marketData.find(a => a.symbol === 'AAPL')?.price * 32 || 0 },
      { ...marketData.find(a => a.symbol === 'MSFT'), shares: 12, value: marketData.find(a => a.symbol === 'MSFT')?.price * 12 || 0 },
      { ...marketData.find(a => a.symbol === 'TSLA'), shares: 15, value: marketData.find(a => a.symbol === 'TSLA')?.price * 15 || 0 },
      { ...marketData.find(a => a.symbol === 'GOOGL'), shares: 23, value: marketData.find(a => a.symbol === 'GOOGL')?.price * 23 || 0 },
      { ...marketData.find(a => a.symbol === 'BTC'), shares: 0.1234, value: marketData.find(a => a.symbol === 'BTC')?.price * 0.1234 || 0 },
      { ...marketData.find(a => a.symbol === 'ETH'), shares: 1.2567, value: marketData.find(a => a.symbol === 'ETH')?.price * 1.2567 || 0 },
      { ...marketData.find(a => a.symbol === 'SOL'), shares: 15.67, value: marketData.find(a => a.symbol === 'SOL')?.price * 15.67 || 0 }
    ].filter(h => h && h.symbol);

    const totalStocks = holdings.filter(h => !['BTC', 'ETH', 'SOL'].includes(h.symbol)).reduce((sum, h) => sum + h.value, 0);
    const totalCrypto = holdings.filter(h => ['BTC', 'ETH', 'SOL'].includes(h.symbol)).reduce((sum, h) => sum + h.value, 0);
    
    return (
      <div className="space-y-6 fade-in">
        {/* Main Portfolio Header */}
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200 p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">Total Portfolio Value</div>
              <div className="text-4xl font-bold text-black mb-2">
                ${portfolioValue.toLocaleString('en-US', {minimumFractionDigits: 2})}
              </div>
              <div className="flex items-center text-sm space-x-4">
                <div className="flex items-center">
                  <span className={`font-medium ${todayPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {todayPL >= 0 ? '+' : ''}${todayPL.toLocaleString('en-US', {minimumFractionDigits: 2})}
                  </span>
                  <span className={`ml-1 ${todayPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ({todayPL >= 0 ? '+' : ''}{todayPLPercent}%) Today
                  </span>
                </div>
                <div className="text-gray-600">
                  All Time: <span className="text-green-600 font-medium">+$4,123.45 (+20.17%)</span>
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
          
          {/* Portfolio Performance Chart - Robinhood Style */}
          <div className="h-64 bg-white rounded-lg relative overflow-hidden border group">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-50/50 pointer-events-none"></div>
            <svg className="w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="portfolioGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25"/>
                  <stop offset="50%" stopColor="#10b981" stopOpacity="0.1"/>
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0"/>
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge> 
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              {/* Grid lines */}
              <g stroke="#f3f4f6" strokeWidth="0.5" opacity="0.6">
                <line x1="0" y1="40" x2="800" y2="40" />
                <line x1="0" y1="80" x2="800" y2="80" />
                <line x1="0" y1="120" x2="800" y2="120" />
                <line x1="0" y1="160" x2="800" y2="160" />
                <line x1="200" y1="0" x2="200" y2="200" />
                <line x1="400" y1="0" x2="400" y2="200" />
                <line x1="600" y1="0" x2="600" y2="200" />
              </g>
              
              {/* Portfolio trend line with smooth curve */}
              <path 
                d="M 0,150 C 80,140 120,130 200,125 S 320,115 400,105 S 520,95 600,85 S 720,75 800,65" 
                stroke="#10b981" 
                strokeWidth="3" 
                fill="none"
                filter="url(#glow)"
                className="chart-line"
                strokeDasharray="1000"
                strokeDashoffset="0"
              />
              
              {/* Filled area under curve */}
              <path 
                d="M 0,150 C 80,140 120,130 200,125 S 320,115 400,105 S 520,95 600,85 S 720,75 800,65 L 800,200 L 0,200 Z" 
                fill="url(#portfolioGradient)"
                className="chart-fill"
                style={{ opacity: 1 }}
              />
              
              {/* Interactive data points */}
              <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <circle cx="0" cy="150" r="4" fill="#10b981" stroke="white" strokeWidth="2">
                  <animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite"/>
                </circle>
                <circle cx="200" cy="125" r="4" fill="#10b981" stroke="white" strokeWidth="2">
                  <animate attributeName="r" values="4;6;4" dur="2s" begin="0.5s" repeatCount="indefinite"/>
                </circle>
                <circle cx="400" cy="105" r="4" fill="#10b981" stroke="white" strokeWidth="2">
                  <animate attributeName="r" values="4;6;4" dur="2s" begin="1s" repeatCount="indefinite"/>
                </circle>
                <circle cx="600" cy="85" r="4" fill="#10b981" stroke="white" strokeWidth="2">
                  <animate attributeName="r" values="4;6;4" dur="2s" begin="1.5s" repeatCount="indefinite"/>
                </circle>
                <circle cx="800" cy="65" r="4" fill="#10b981" stroke="white" strokeWidth="2">
                  <animate attributeName="r" values="4;6;4" dur="2s" begin="2s" repeatCount="indefinite"/>
                </circle>
              </g>
              
              {/* Live indicator */}
              <g className="live-dot">
                <circle cx="800" cy="65" r="8" fill="#10b981" opacity="0.2">
                  <animate attributeName="r" values="8;16;8" dur="2s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.2;0;0.2" dur="2s" repeatCount="indefinite"/>
                </circle>
                <circle cx="800" cy="65" r="4" fill="#10b981" opacity="0.6">
                  <animate attributeName="r" values="4;8;4" dur="1.5s" repeatCount="indefinite"/>
                </circle>
                <circle cx="800" cy="65" r="2" fill="#ffffff" stroke="#10b981" strokeWidth="1"/>
              </g>
            </svg>
            
            {/* Time labels overlay */}
            <div className="absolute bottom-2 left-0 right-0 flex justify-between px-4 text-xs text-gray-500">
              <span>9:30 AM</span>
              <span>11:00 AM</span>
              <span>12:30 PM</span>
              <span>2:00 PM</span>
              <span className="text-green-600 font-medium">Live</span>
            </div>
            
            {/* Value labels overlay */}
            <div className="absolute top-2 left-4 right-4 flex justify-between text-xs text-gray-500">
              <span>${(portfolioValue * 1.1).toFixed(0)}</span>
              <span>${portfolioValue.toFixed(0)}</span>
              <span>${(portfolioValue * 0.95).toFixed(0)}</span>
            </div>
            
            {/* Live Performance Stats Overlay */}
            <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg px-4 py-3 shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-gray-600">LIVE</span>
              </div>
              <div className="space-y-1">
                <div className="text-xl font-bold text-black">${portfolioValue.toLocaleString()}</div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-green-600">+${((portfolioValue * todayPLPercent) / 100).toFixed(2)}</span>
                  <span className="text-sm text-green-600">(+{todayPLPercent}%)</span>
                </div>
                <div className="text-xs text-gray-500">Today's Return</div>
              </div>
            </div>
            
            {/* Hover tooltip */}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/90 text-white px-3 py-2 rounded-lg text-sm backdrop-blur-sm">
              <div className="font-medium">Portfolio Details</div>
              <div className="text-xs text-green-400">Market open: 9:30 AM EST</div>
              <div className="text-xs text-gray-300">Last sync: {new Date().toLocaleTimeString()}</div>
              <div className="text-xs text-gray-300">Next update: {new Date(Date.now() + 5000).toLocaleTimeString()}</div>
            </div>
          </div>
        </div>

        {/* Key Portfolio Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Buying Power</div>
            <div className="text-xl font-bold text-black">$15,420.00</div>
            <div className="text-xs text-gray-500 mt-1">Available Cash</div>
          </div>
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
                    <div className="text-sm font-medium text-gray-600">Total</div>
                    <div className="text-lg font-bold text-black">${(portfolioValue/1000).toFixed(0)}K</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-2 mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm">Stocks</span>
                </div>
                <span className="text-sm font-medium">{((totalStocks/portfolioValue) * 100).toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-amber-500 rounded-full mr-2"></div>
                  <span className="text-sm">Crypto</span>
                </div>
                <span className="text-sm font-medium">{((totalCrypto/portfolioValue) * 100).toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-300 rounded-full mr-2"></div>
                  <span className="text-sm">Cash</span>
                </div>
                <span className="text-sm font-medium">38.5%</span>
              </div>
            </div>
          </div>

          {/* Top Performers */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-black mb-4">Top Performers Today</h3>
            <div className="space-y-3">
              {holdings
                .filter(h => h.change > 0)
                .sort((a, b) => b.change - a.change)
                .slice(0, 4)
                .map((holding) => (
                  <div key={holding.symbol} className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 overflow-hidden bg-gray-100">
                        {holding.logo ? (
                          <img src={holding.logo} alt={holding.symbol} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-green-600">{holding.symbol}</span>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{holding.symbol}</div>
                        <div className="text-xs text-gray-500">{holding.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">+{holding.change.toFixed(2)}%</div>
                      <div className="text-xs text-gray-500">${holding.value.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Market Overview */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-black mb-4">Market Overview</h3>
            <div className="space-y-3">
              {(() => {
                const marketIndices = [
                  { symbol: 'SPY', name: 'S&P 500' },
                  { symbol: 'QQQ', name: 'NASDAQ' },
                  { symbol: 'BTC', name: 'Bitcoin' },
                  { symbol: 'VIX', name: 'VIX' }
                ];
                
                return marketIndices.map(index => {
                  const asset = liveAssets.find(a => a.symbol === index.symbol);
                  return (
                    <div key={index.symbol} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{index.name}</span>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {asset ? `${index.symbol === 'BTC' ? '$' : ''}${asset.price.toLocaleString('en-US', {minimumFractionDigits: 2})}` : 'N/A'}
                        </div>
                        <div className={`text-xs ${asset && asset.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {asset ? `${asset.change >= 0 ? '+' : ''}${asset.change.toFixed(2)}%` : 'N/A'}
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>

        {/* Detailed Holdings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-black">Portfolio Holdings</h3>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button size="sm" className="bg-green-500 hover:bg-green-600">
                <Plus className="h-4 w-4 mr-2" />
                Add Position
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Symbol</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Shares/Amount</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Price</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Market Value</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Day Change</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">% of Portfolio</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((holding) => (
                  <tr key={holding.symbol} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 overflow-hidden bg-gray-100">
                          {holding.logo ? (
                            <img src={holding.logo} alt={holding.symbol} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-bold text-green-600">{holding.symbol}</span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{holding.symbol}</div>
                          <div className="text-sm text-gray-500">{holding.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {holding.shares < 1 ? holding.shares.toFixed(4) : holding.shares.toFixed(0)}
                    </td>
                    <td className="py-3 px-4 text-right text-sm">
                      ${holding.price?.toLocaleString('en-US', {minimumFractionDigits: 2}) || '0.00'}
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      ${holding.value?.toLocaleString('en-US', {minimumFractionDigits: 2}) || '0.00'}
                    </td>
                    <td className={`py-3 px-4 text-right font-medium ${holding.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {holding.change >= 0 ? '+' : ''}{holding.change?.toFixed(2) || '0.00'}%
                    </td>
                    <td className="py-3 px-4 text-right text-sm">
                      {((holding.value / portfolioValue) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-black mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <div className="font-medium text-sm">Bought 5 shares of AAPL</div>
                  <div className="text-xs text-gray-500">2 hours ago</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">$846.90</div>
                <div className="text-xs text-green-600">Executed</div>
              </div>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center mr-3">
                  <Bitcoin className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <div className="font-medium text-sm">Sold 0.05 BTC</div>
                  <div className="text-xs text-gray-500">1 day ago</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">$1,850.63</div>
                <div className="text-xs text-green-600">Executed</div>
              </div>
            </div>
            <div className="flex justify-between items-center py-2">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-sm">Dividend received from MSFT</div>
                  <div className="text-xs text-gray-500">3 days ago</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">$32.40</div>
                <div className="text-xs text-green-600">Received</div>
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
        {/* Header Section */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-black">Stocks</h1>
            <p className="text-gray-600">Total Stock Value: $38,520.00</p>
          </div>
          <Button className="bg-green-500 hover:bg-green-600 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Buy Stocks
          </Button>
        </div>

        {/* Portfolio Summary */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-black">$38,520</div>
              <div className="text-sm text-gray-600">Market Value</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">+$1,240</div>
              <div className="text-sm text-gray-600">Today's Return</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">+$4,820</div>
              <div className="text-sm text-gray-600">Total Return</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-black">12.5%</div>
              <div className="text-sm text-gray-600">Portfolio Gain</div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search stocks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stock Holdings */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-black">Your Holdings ({filteredStocks.length} stocks)</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {filteredStocks.slice(0, 20).map((asset) => (
              <div key={asset.symbol} className="p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center overflow-hidden">
                      {asset.logo ? (
                        <img src={asset.logo} alt={asset.symbol} className="w-8 h-8 object-contain" />
                      ) : (
                        <span className="text-sm font-bold text-green-600">{asset.symbol}</span>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-black">{asset.symbol}</div>
                      <div className="text-sm text-gray-600">{asset.name}</div>
                      <div className="text-xs text-gray-500">{Math.floor(Math.random() * 50) + 1} shares</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-black">${asset.price.toFixed(2)}</div>
                    <div className={`text-sm ${asset.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)}%
                    </div>
                  </div>
                  <div className="text-right ml-6">
                    <div className="font-bold text-black">
                      ${(asset.price * (Math.floor(Math.random() * 50) + 1)).toLocaleString()}
                    </div>
                    <div className={`text-sm ${asset.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {asset.change >= 0 ? '+' : ''}${((asset.price * (Math.floor(Math.random() * 50) + 1)) * asset.change / 100).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Market Movers */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-black">Market Movers</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">NVDA</div>
                <div className="text-sm text-gray-600">+4.85%</div>
                <div className="text-xs text-gray-500">Top Gainer</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-lg font-bold text-red-600">NFLX</div>
                <div className="text-sm text-gray-600">-1.25%</div>
                <div className="text-xs text-gray-500">Top Loser</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">AAPL</div>
                <div className="text-sm text-gray-600">$185.60</div>
                <div className="text-xs text-gray-500">Most Active</div>
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
        {/* Header Section */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-black">Crypto</h1>
            <p className="text-gray-600">Total Crypto Value: $18,250.00</p>
          </div>
          <Button className="bg-green-500 hover:bg-green-600 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Buy Crypto
          </Button>
        </div>

        {/* Portfolio Summary */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-black">$18,250</div>
              <div className="text-sm text-gray-600">Market Value</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">+$850</div>
              <div className="text-sm text-gray-600">Today's Return</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">+$3,250</div>
              <div className="text-sm text-gray-600">Total Return</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-black">21.7%</div>
              <div className="text-sm text-gray-600">Portfolio Gain</div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search cryptocurrencies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Crypto Holdings */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-black">Your Holdings ({filteredCryptos.length} cryptocurrencies)</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {filteredCryptos.slice(0, 20).map((asset) => (
              <div key={asset.symbol} className="p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center overflow-hidden">
                      {asset.logo ? (
                        <img src={asset.logo} alt={asset.symbol} className="w-8 h-8 object-contain" />
                      ) : asset.symbol === 'BTC' ? (
                        <Bitcoin className="h-6 w-6 text-orange-600" />
                      ) : (
                        <span className="text-sm font-bold text-orange-600">{asset.symbol}</span>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-black">{asset.symbol}</div>
                      <div className="text-sm text-gray-600">{asset.name}</div>
                      <div className="text-xs text-gray-500">
                        {(Math.random() * 100).toFixed(asset.price > 1000 ? 4 : 2)} {asset.symbol}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-black">${asset.price.toFixed(asset.price > 1000 ? 2 : asset.price > 1 ? 2 : 4)}</div>
                    <div className={`text-sm ${asset.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)}%
                    </div>
                  </div>
                  <div className="text-right ml-6">
                    <div className="font-bold text-black">
                      ${(asset.price * (Math.random() * 100)).toLocaleString()}
                    </div>
                    <div className={`text-sm ${asset.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {asset.change >= 0 ? '+' : ''}${((asset.price * (Math.random() * 100)) * asset.change / 100).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Market Movers */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-black">Market Movers</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">SOL</div>
                <div className="text-sm text-gray-600">+4.12%</div>
                <div className="text-xs text-gray-500">Top Gainer</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-lg font-bold text-red-600">MATIC</div>
                <div className="text-sm text-gray-600">-2.15%</div>
                <div className="text-xs text-gray-500">Top Loser</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">BTC</div>
                <div className="text-sm text-gray-600">$43,250</div>
                <div className="text-xs text-gray-500">Most Active</div>
              </div>
            </div>
          </div>
        </div>

        {/* Fear & Greed Index */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-black">Fear & Greed Index</h3>
          </div>
          <div className="p-6 text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">72</div>
            <div className="text-lg font-medium text-black mb-1">Greed</div>
            <div className="text-sm text-gray-600">Market sentiment indicates buying opportunity</div>
          </div>
        </div>
      </div>
    );
  }


  function renderTrade() {
    // Check if user is on iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    return (
      <div className="space-y-6 fade-in">
        {/* iOS Warning */}
        {isIOS && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-sm font-bold">!</span>
              </div>
              <div>
                <div className="font-medium text-orange-800">iOS Users Notice</div>
                <div className="text-sm text-orange-700 mt-1">
                  Live trading is only available on the web app. Please use a desktop browser or our web app for full trading functionality.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trading Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-black slide-in-left">Live Trading</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${liveTrading ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="text-sm font-medium">{liveTrading ? 'Live' : 'Offline'}</span>
            </div>
            <Button
              onClick={() => setLiveTrading(!liveTrading)}
              className={`${liveTrading ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white hover-scale transition-all duration-300`}
              disabled={isIOS}
            >
              {liveTrading ? <Square className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {liveTrading ? 'Stop Trading' : 'Start Trading'}
            </Button>
          </div>
        </div>

        {/* Market Categories */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-sm text-gray-600">Crypto Markets</div>
            <div className="text-2xl font-bold text-black">{cryptoAssets.length}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-sm text-gray-600">Stock Markets</div>
            <div className="text-2xl font-bold text-black">{stockAssets.length}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-sm text-gray-600">Total Assets</div>
            <div className="text-2xl font-bold text-black">{allAssets.length}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-sm text-gray-600">Trading Pairs</div>
            <div className="text-2xl font-bold text-black">{cryptoAssets.length + stockAssets.length}</div>
          </div>
        </div>

        {/* Crypto Markets */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="text-lg font-medium text-black">Cryptocurrency Markets</div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cryptoAssets.slice(0, 12).map((asset) => (
                <div key={asset.symbol} className="border border-gray-200 rounded-lg p-4 hover-scale transition-all duration-300">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center overflow-hidden">
                        {asset.logo ? (
                          <img src={asset.logo} alt={asset.symbol} className="w-6 h-6 object-contain" />
                        ) : (
                          <span className="text-xs font-bold text-orange-600">{asset.symbol.slice(0, 3)}</span>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-lg text-black">{asset.symbol}</div>
                        <div className="text-xs text-gray-600">{asset.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-black">${asset.price.toFixed(asset.price > 1000 ? 2 : asset.price > 1 ? 2 : 4)}</div>
                      <div className={`text-sm font-medium px-2 py-1 rounded ${asset.change >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-green-500 hover:bg-green-600"
                      disabled={!liveTrading || placeTradeMutation.isPending}
                      onClick={() => {
                        placeTradeMutation.mutate({
                          symbol: asset.symbol,
                          type: 'buy',
                          quantity: 1,
                          price: asset.price,
                          amount: asset.price.toString()
                        });
                      }}
                    >
                      <TrendingUp className="h-4 w-4 mr-1" />
                      Buy
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                      disabled={!liveTrading || placeTradeMutation.isPending}
                      onClick={() => {
                        placeTradeMutation.mutate({
                          symbol: asset.symbol,
                          type: 'sell',
                          quantity: 1,
                          price: asset.price,
                          amount: asset.price.toString()
                        });
                      }}
                    >
                      <TrendingUp className="h-4 w-4 mr-1 rotate-180" />
                      Sell
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stock Markets */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="text-lg font-medium text-black">Stock Markets</div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stockAssets.slice(0, 12).map((asset) => (
                <div key={asset.symbol} className="border border-gray-200 rounded-lg p-4 hover-scale transition-all duration-300">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center overflow-hidden">
                        {asset.logo ? (
                          <img src={asset.logo} alt={asset.symbol} className="w-6 h-6 object-contain" />
                        ) : (
                          <span className="text-xs font-bold text-green-600">{asset.symbol.slice(0, 3)}</span>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-lg text-black">{asset.symbol}</div>
                        <div className="text-xs text-gray-600">{asset.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-black">${asset.price.toFixed(2)}</div>
                      <div className={`text-sm font-medium px-2 py-1 rounded ${asset.change >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-green-500 hover:bg-green-600"
                      disabled={!liveTrading || placeTradeMutation.isPending}
                      onClick={() => {
                        placeTradeMutation.mutate({
                          symbol: asset.symbol,
                          type: 'buy',
                          quantity: 1,
                          price: asset.price,
                          amount: asset.price.toString()
                        });
                      }}
                    >
                      <TrendingUp className="h-4 w-4 mr-1" />
                      Buy
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                      disabled={!liveTrading || placeTradeMutation.isPending}
                      onClick={() => {
                        placeTradeMutation.mutate({
                          symbol: asset.symbol,
                          type: 'sell',
                          quantity: 1,
                          price: asset.price,
                          amount: asset.price.toString()
                        });
                      }}
                    >
                      <TrendingUp className="h-4 w-4 mr-1 rotate-180" />
                      Sell
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Popular Assets */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="text-lg font-medium text-black">Popular Trading Assets</div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...cryptoAssets.slice(0, 6), ...stockAssets.slice(0, 6)].map((asset) => (
                <div key={asset.symbol} className="border border-gray-200 rounded-lg p-4 hover-scale transition-all duration-300">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 ${asset.type === 'crypto' ? 'bg-orange-100' : 'bg-green-100'} rounded-full flex items-center justify-center overflow-hidden`}>
                        {asset.logo ? (
                          <img src={asset.logo} alt={asset.symbol} className="w-6 h-6 object-contain" />
                        ) : (
                          <span className={`text-xs font-bold ${asset.type === 'crypto' ? 'text-orange-600' : 'text-green-600'}`}>{asset.symbol.slice(0, 3)}</span>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-lg text-black">{asset.symbol}</div>
                        <div className="text-xs text-gray-600">{asset.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-black">${asset.price.toFixed(asset.price > 1000 ? 2 : asset.price > 1 ? 2 : 4)}</div>
                      <div className={`text-sm font-medium px-2 py-1 rounded ${asset.change >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-green-500 hover:bg-green-600"
                      disabled={!liveTrading || placeTradeMutation.isPending}
                      onClick={() => {
                        placeTradeMutation.mutate({
                          symbol: asset.symbol,
                          type: 'buy',
                          quantity: 1,
                          price: asset.price,
                          amount: asset.price.toString()
                        });
                      }}
                    >
                      <TrendingUp className="h-4 w-4 mr-1" />
                      Buy
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                      disabled={!liveTrading || placeTradeMutation.isPending}
                      onClick={() => {
                        placeTradeMutation.mutate({
                          symbol: asset.symbol,
                          type: 'sell',
                          quantity: 1,
                          price: asset.price,
                          amount: asset.price.toString()
                        });
                      }}
                    >
                      <TrendingUp className="h-4 w-4 mr-1 rotate-180" />
                      Sell
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Live Trades */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="text-lg font-medium text-black">Recent Trading Activity</div>
          </div>
          <div className="p-4">
            {trades && trades.length > 0 ? (
              <div className="space-y-3">
                {trades.slice(0, 5).map((trade) => (
                  <div key={trade.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover-scale transition-all duration-300">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${trade.type === 'buy' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <div>
                        <div className="font-medium text-black">{trade.pair}</div>
                        <div className="text-sm text-gray-600">{trade.createdAt ? new Date(trade.createdAt).toLocaleTimeString() : 'N/A'}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-black">${trade.entryPrice}</div>
                      <div className={`text-sm ${trade.type === 'buy' ? 'text-green-600' : 'text-red-600'}`}>
                        {trade.type.toUpperCase()} {trade.volume || '1'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-600 py-8">
                <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <div>No trades yet</div>
                <div className="text-sm">Start live trading to see activity here</div>
              </div>
            )}
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
