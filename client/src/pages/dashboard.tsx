import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  HelpCircle
} from "lucide-react";
import type { Portfolio, Trade, PerformanceMetric } from "@shared/schema";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false); // Default closed on mobile
  const [activeView, setActiveView] = useState('dashboard');

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
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-800"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              Bitrader
            </h1>
            <nav className="hidden md:flex space-x-6">
              <button 
                onClick={() => setActiveView('dashboard')}
                className={`transition-colors ${activeView === 'dashboard' ? 'text-white' : 'text-slate-400 hover:text-blue-400'}`}
              >
                Dashboard
              </button>
              <button 
                onClick={() => setActiveView('portfolio')}
                className={`transition-colors ${activeView === 'portfolio' ? 'text-white' : 'text-slate-400 hover:text-blue-400'}`}
              >
                Portfolio
              </button>
              <button 
                onClick={() => setActiveView('trades')}
                className={`transition-colors ${activeView === 'trades' ? 'text-white' : 'text-slate-400 hover:text-blue-400'}`}
              >
                Trade History
              </button>
              <button 
                onClick={() => setActiveView('analytics')}
                className={`transition-colors ${activeView === 'analytics' ? 'text-white' : 'text-slate-400 hover:text-blue-400'}`}
              >
                Analytics
              </button>
            </nav>
          </div>
          <div className="flex items-center space-x-2 lg:space-x-4">
            <Button className="bg-blue-600 hover:bg-blue-700 hidden sm:flex">
              <Plus className="mr-2 h-4 w-4" />
              New Trade
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 sm:hidden p-2">
              <Plus className="h-4 w-4" />
            </Button>
            <div className="flex items-center space-x-2 lg:space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium">{getUserInitials(user)}</span>
              </div>
              <span className="text-sm hidden sm:block">{getUserName(user)}</span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.location.href = '/api/logout'}
                className="text-slate-400 hover:text-white p-2"
              >
                <span className="hidden sm:block">Logout</span>
                <span className="sm:hidden">Exit</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex relative">
        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Sidebar */}
        <aside className={`${
          sidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full lg:w-16 lg:translate-x-0'
        } bg-slate-900 h-screen border-r border-slate-700 transition-all duration-300 ease-in-out overflow-hidden fixed lg:relative z-50`}>
          <div className="p-6">
          <div className="space-y-6">
            <div>
              {sidebarOpen && <h3 className="text-slate-400 text-xs uppercase tracking-wider mb-3">Account</h3>}
              <nav className="space-y-2">
                <button 
                  onClick={() => setActiveView('dashboard')}
                  className={`flex items-center space-x-3 w-full text-left px-3 py-2 rounded-lg transition-all duration-300 hover-lift scale-hover ${
                    activeView === 'dashboard' 
                      ? 'text-white bg-blue-600/20 shadow-lg' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <ChartLine className={`h-4 w-4 text-blue-500 flex-shrink-0 ${activeView === 'dashboard' ? 'pulse-subtle' : ''}`} />
                  {sidebarOpen && <span className="slide-in-right">Dashboard</span>}
                </button>
                <button 
                  onClick={() => setActiveView('portfolio')}
                  className={`flex items-center space-x-3 w-full text-left px-3 py-2 rounded-lg transition-all duration-300 hover-lift scale-hover ${
                    activeView === 'portfolio' 
                      ? 'text-white bg-blue-600/20 shadow-lg' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <Wallet className={`h-4 w-4 flex-shrink-0 ${activeView === 'portfolio' ? 'pulse-subtle' : ''}`} />
                  {sidebarOpen && <span className="slide-in-right">Portfolio</span>}
                </button>
                <button 
                  onClick={() => setActiveView('trades')}
                  className={`flex items-center space-x-3 w-full text-left px-3 py-2 rounded-lg transition-all duration-300 hover-lift scale-hover ${
                    activeView === 'trades' 
                      ? 'text-white bg-blue-600/20 shadow-lg' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <History className={`h-4 w-4 flex-shrink-0 ${activeView === 'trades' ? 'pulse-subtle' : ''}`} />
                  {sidebarOpen && <span className="slide-in-right">Trade History</span>}
                </button>
                <button 
                  onClick={() => setActiveView('analytics')}
                  className={`flex items-center space-x-3 w-full text-left px-3 py-2 rounded-lg transition-all duration-300 hover-lift scale-hover ${
                    activeView === 'analytics' 
                      ? 'text-white bg-blue-600/20 shadow-lg' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <BarChart3 className={`h-4 w-4 flex-shrink-0 ${activeView === 'analytics' ? 'pulse-subtle' : ''}`} />
                  {sidebarOpen && <span className="slide-in-right">Analytics</span>}
                </button>
              </nav>
            </div>
            
            <div>
              {sidebarOpen && <h3 className="text-slate-400 text-xs uppercase tracking-wider mb-3">Algorithms</h3>}
              <nav className="space-y-2">
                <button 
                  onClick={() => setActiveView('forex')}
                  className={`flex items-center space-x-3 w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    activeView === 'forex' 
                      ? 'text-white bg-blue-600/20' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <Coins className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                  {sidebarOpen && <span>Forex</span>}
                </button>
                <button 
                  onClick={() => setActiveView('gold')}
                  className={`flex items-center space-x-3 w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    activeView === 'gold' 
                      ? 'text-white bg-blue-600/20' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <Gem className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                  {sidebarOpen && <span>Gold</span>}
                </button>
                <button 
                  onClick={() => setActiveView('stocks')}
                  className={`flex items-center space-x-3 w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    activeView === 'stocks' 
                      ? 'text-white bg-blue-600/20' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <BarChart3 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  {sidebarOpen && <span>Stocks</span>}
                </button>
                <button 
                  onClick={() => setActiveView('crypto')}
                  className={`flex items-center space-x-3 w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    activeView === 'crypto' 
                      ? 'text-white bg-blue-600/20' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <Bitcoin className="h-4 w-4 text-orange-500 flex-shrink-0" />
                  {sidebarOpen && <span>Crypto</span>}
                </button>
              </nav>
            </div>

            <div>
              {sidebarOpen && <h3 className="text-slate-400 text-xs uppercase tracking-wider mb-3">Support</h3>}
              <nav className="space-y-2">
                <button 
                  onClick={() => setActiveView('help')}
                  className={`flex items-center space-x-3 w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    activeView === 'help' 
                      ? 'text-white bg-blue-600/20' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <Headphones className="h-4 w-4 flex-shrink-0" />
                  {sidebarOpen && <span>Help Center</span>}
                </button>
                <button 
                  onClick={() => setActiveView('settings')}
                  className={`flex items-center space-x-3 w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    activeView === 'settings' 
                      ? 'text-white bg-blue-600/20' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <Settings className="h-4 w-4 flex-shrink-0" />
                  {sidebarOpen && <span>Settings</span>}
                </button>
              </nav>
            </div>
          </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-3 lg:p-6 overflow-y-auto">
          {portfolioLoading || tradesLoading || algorithmsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            renderActiveView()
          )}
        </main>
      </div>
    </div>
  );

  function renderActiveView() {
    switch (activeView) {
      case 'dashboard':
        return renderDashboard();
      case 'portfolio':
        return renderPortfolio();
      case 'trades':
        return renderTrades();
      case 'analytics':
        return renderAnalytics();
      case 'forex':
      case 'gold':
      case 'stocks':
      case 'crypto':
        return renderAlgorithm(activeView);
      case 'help':
        return renderHelp();
      case 'settings':
        return renderSettings();
      default:
        return renderDashboard();
    }
  }

  function renderDashboard() {
    return (
      <div>
          {/* Portfolio Overview */}
          <div className="mb-6 lg:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 lg:mb-6 space-y-3 sm:space-y-0">
              <h2 className="text-xl lg:text-2xl font-bold">Portfolio Overview</h2>
              <div className="flex items-center space-x-2 lg:space-x-4">
                <Select>
                  <SelectTrigger className="w-full sm:w-40 bg-slate-900 border-slate-700">
                    <SelectValue placeholder="Last 30 days" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                    <SelectItem value="365">Last year</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 touch-manipulation">
                  <Download className="mr-0 sm:mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
              </div>
            </div>

            {/* Portfolio Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-6 lg:mb-8">
              <Card className="bg-slate-900 border-slate-700 hover-lift scale-hover slide-in-left stagger-1 cursor-pointer touch-manipulation">
                <CardContent className="p-3 lg:p-6">
                  <div className="flex items-center justify-between mb-1 lg:mb-2">
                    <span className="text-slate-400 text-xs lg:text-sm">Total Balance</span>
                    <Wallet className="h-4 w-4 lg:h-5 lg:w-5 text-blue-500 pulse-subtle" />
                  </div>
                  <div className="text-lg lg:text-2xl font-bold count-up gradient-animate bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
                    ${portfolio?.totalBalance ? parseFloat(portfolio.totalBalance).toLocaleString('en-US', {minimumFractionDigits: 2}) : '0.00'}
                  </div>
                  <div className="text-xs lg:text-sm text-green-500 slide-in-right hidden sm:block">+12.5% this month</div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-700 hover-lift scale-hover slide-in-left stagger-2 cursor-pointer touch-manipulation">
                <CardContent className="p-3 lg:p-6">
                  <div className="flex items-center justify-between mb-1 lg:mb-2">
                    <span className="text-slate-400 text-xs lg:text-sm">Today's P&L</span>
                    <TrendingUp className="h-4 w-4 lg:h-5 lg:w-5 text-green-500 heartbeat" />
                  </div>
                  <div className="text-lg lg:text-2xl font-bold text-green-500 count-up">
                    +${portfolio?.todayPL ? parseFloat(portfolio.todayPL).toLocaleString('en-US', {minimumFractionDigits: 2}) : '0.00'}
                  </div>
                  <div className="text-xs lg:text-sm text-slate-400 slide-in-right hidden sm:block">+1.97% today</div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-700 hover-lift scale-hover slide-in-left stagger-3 cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400 text-sm">Win Rate</span>
                    <Target className="h-5 w-5 text-blue-500 pulse-subtle" />
                  </div>
                  <div className="text-2xl font-bold count-up">
                    {portfolio?.winRate ? parseFloat(portfolio.winRate).toFixed(1) : '0.0'}%
                  </div>
                  <div className="text-sm text-green-500 slide-in-right">+2.1% vs last month</div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-700 hover-lift scale-hover slide-in-left stagger-4 cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400 text-sm">Active Algorithms</span>
                    <Bot className="h-5 w-5 text-blue-400 heartbeat" />
                  </div>
                  <div className="text-2xl font-bold count-up">
                    {portfolio?.activeAlgorithms || 0}
                  </div>
                  <div className="text-sm text-slate-400 slide-in-right">All performing well</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Portfolio Growth Chart */}
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">Portfolio Growth</CardTitle>
                  <div className="flex space-x-2">
                    <Button size="sm" className="bg-blue-600 text-xs px-3 py-1">1M</Button>
                    <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white text-xs px-3 py-1">3M</Button>
                    <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white text-xs px-3 py-1">1Y</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-slate-800 rounded-lg flex items-center justify-center">
                  <img 
                    src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400" 
                    alt="Portfolio growth chart visualization" 
                    className="w-full h-full object-cover rounded-lg opacity-80" 
                  />
                </div>
              </CardContent>
            </Card>

            {/* Algorithm Performance */}
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Algorithm Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg hover-lift scale-hover cursor-pointer slide-in-left stagger-1">
                    <div className="flex items-center space-x-3">
                      <Coins className="h-5 w-5 text-yellow-500 pulse-subtle" />
                      <div>
                        <div className="font-medium">Forex Algorithm</div>
                        <div className="text-sm text-slate-400">EUR/USD, GBP/USD, USD/JPY</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-green-500 count-up">+$8,945.20</div>
                      <div className="text-sm text-slate-400">82.1% win rate</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg hover-lift scale-hover cursor-pointer slide-in-left stagger-2">
                    <div className="flex items-center space-x-3">
                      <Gem className="h-5 w-5 text-yellow-400 heartbeat" />
                      <div>
                        <div className="font-medium">Gold Algorithm</div>
                        <div className="text-sm text-slate-400">XAU/USD</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-green-500 count-up">+$3,124.85</div>
                      <div className="text-sm text-slate-400">75.3% win rate</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg hover-lift scale-hover cursor-pointer slide-in-left stagger-3">
                    <div className="flex items-center space-x-3">
                      <BarChart3 className="h-5 w-5 text-green-500 pulse-subtle" />
                      <div>
                        <div className="font-medium">Stocks Algorithm</div>
                        <div className="text-sm text-slate-400">SPY, QQQ, AAPL</div>
                      </div>
                    </div>     
                    <div className="text-right">
                      <div className="font-medium text-green-500 count-up">+$2,687.40</div>
                      <div className="text-sm text-slate-400">79.6% win rate</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Bitcoin className="h-5 w-5 text-orange-500" />
                      <div>
                        <div className="font-medium">Crypto Algorithm</div>
                        <div className="text-sm text-slate-400">BTC, ETH, SOL</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-green-500">+$1,532.90</div>
                      <div className="text-sm text-slate-400">74.8% win rate</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Trades & Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Trades */}
            <Card className="lg:col-span-2 bg-slate-900 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">Recent Trades</CardTitle>
                  <a href="#" className="text-blue-500 hover:text-blue-400 text-sm">View All</a>
                </div>
              </CardHeader>
              <CardContent>
                {tradesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  </div>
                ) : trades && trades.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-slate-400 border-b border-slate-700">
                          <th className="text-left py-3">Pair</th>
                          <th className="text-left py-3">Type</th>
                          <th className="text-left py-3">Entry</th>
                          <th className="text-left py-3">Exit</th>
                          <th className="text-right py-3">P&L</th>
                          <th className="text-right py-3">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trades.slice(0, 4).map((trade) => (
                          <tr key={trade.id} className="border-b border-slate-800">
                            <td className="py-3 font-medium">{trade.pair}</td>
                            <td className="py-3">
                              <span className={`px-2 py-1 rounded text-xs ${
                                trade.type === 'BUY' 
                                  ? 'bg-green-500/20 text-green-500' 
                                  : 'bg-red-500/20 text-red-500'
                              }`}>
                                {trade.type}
                              </span>
                            </td>
                            <td className="py-3">{parseFloat(trade.entryPrice).toFixed(5)}</td>
                            <td className="py-3">
                              {trade.exitPrice ? parseFloat(trade.exitPrice).toFixed(5) : '-'}
                            </td>
                            <td className="py-3 text-right">
                              {trade.profitLoss ? (
                                <span className={parseFloat(trade.profitLoss) >= 0 ? 'text-green-500' : 'text-red-500'}>
                                  {parseFloat(trade.profitLoss) >= 0 ? '+' : ''}
                                  ${parseFloat(trade.profitLoss).toFixed(2)}
                                </span>
                              ) : '-'}
                            </td>
                            <td className="py-3 text-right text-slate-400">
                              {trade.createdAt ? new Date(trade.createdAt).toLocaleDateString() : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-slate-400">No trades yet. Start trading to see your history here.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Performance Analytics */}
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Performance Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-32 bg-slate-800 rounded-lg mb-4 flex items-center justify-center">
                  <img 
                    src="https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200" 
                    alt="Performance analytics chart" 
                    className="w-full h-full object-cover rounded-lg opacity-80" 
                  />
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Sharpe Ratio</span>
                    <span className="font-medium">
                      {performance && performance.length > 0 && performance[0]?.sharpeRatio ? parseFloat(performance[0].sharpeRatio).toFixed(2) : '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Max Drawdown</span>
                    <span className="font-medium text-red-500">
                      {performance && performance.length > 0 && performance[0]?.maxDrawdown ? parseFloat(performance[0].maxDrawdown).toFixed(1) : '0.0'}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Avg. Trade Duration</span>
                    <span className="font-medium">
                      {performance && performance.length > 0 && performance[0]?.avgTradeDuration ? parseFloat(performance[0].avgTradeDuration).toFixed(1) : '0.0'}h
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Profit Factor</span>
                    <span className="font-medium text-green-500">
                      {performance && performance.length > 0 && performance[0]?.profitFactor ? parseFloat(performance[0].profitFactor).toFixed(2) : '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Total Trades</span>
                    <span className="font-medium">
                      {performance && performance.length > 0 && performance[0]?.totalTrades ? performance[0].totalTrades : 0}
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-700">
                  <h4 className="font-medium mb-3">Risk Score</h4>
                  <div className="flex items-center space-x-3">
                    <div className="flex-1 bg-slate-950 rounded-full h-2">
                      <div className="bg-gradient-to-r from-green-500 to-yellow-500 h-2 rounded-full" style={{width: '35%'}}></div>
                    </div>
                    <span className="text-sm font-medium text-green-500">Low Risk</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Market Insights Section */}
          <div className="mt-8">
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Market Insights & AI Signals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-slate-950 rounded-lg p-4">
                    <img 
                      src="https://images.unsplash.com/photo-1639322537228-f710d846310a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200" 
                      alt="Financial market analysis dashboard" 
                      className="w-full h-32 object-cover rounded mb-3 opacity-80" 
                    />
                    <h4 className="font-medium mb-2">EUR/USD Forecast</h4>
                    <p className="text-sm text-slate-400 mb-3">AI predicts bullish momentum with 85% confidence. ECB policy changes expected.</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded">BULLISH</span>
                      <span className="text-xs text-slate-400">Updated 15min ago</span>
                    </div>
                  </div>

                  <div className="bg-slate-950 rounded-lg p-4">
                    <img 
                      src="https://images.unsplash.com/photo-1642790106117-e829e14a795f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200" 
                      alt="Stock market trading interface" 
                      className="w-full h-32 object-cover rounded mb-3 opacity-80" 
                    />
                    <h4 className="font-medium mb-2">Gold Analysis</h4>
                    <p className="text-sm text-slate-400 mb-3">Strong support at $2,050. AI suggests range-bound trading with breakout potential.</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded">NEUTRAL</span>
                      <span className="text-xs text-slate-400">Updated 22min ago</span>
                    </div>
                  </div>

                  <div className="bg-slate-950 rounded-lg p-4">
                    <img 
                      src="https://images.unsplash.com/photo-1640161704729-cbe966a08476?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200" 
                      alt="Cryptocurrency trading dashboard" 
                      className="w-full h-32 object-cover rounded mb-3 opacity-80" 
                    />
                    <h4 className="font-medium mb-2">Crypto Market</h4>
                    <p className="text-sm text-slate-400 mb-3">Bitcoin showing consolidation. Altcoins expected to outperform in short term.</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded">OPPORTUNITY</span>
                      <span className="text-xs text-slate-400">Updated 8min ago</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
      </div>
    );
  }

  function renderPortfolio() {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-6">Portfolio Details</h2>
        
        {/* Portfolio Allocation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle>Asset Allocation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Coins className="h-5 w-5 text-yellow-500" />
                    <span>Forex</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">45%</div>
                    <div className="text-sm text-slate-400">${portfolio?.totalBalance ? (parseFloat(portfolio.totalBalance) * 0.45).toLocaleString('en-US', {minimumFractionDigits: 2}) : '0.00'}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Gem className="h-5 w-5 text-yellow-400" />
                    <span>Gold</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">25%</div>
                    <div className="text-sm text-slate-400">${portfolio?.totalBalance ? (parseFloat(portfolio.totalBalance) * 0.25).toLocaleString('en-US', {minimumFractionDigits: 2}) : '0.00'}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <BarChart3 className="h-5 w-5 text-green-500" />
                    <span>Stocks</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">20%</div>
                    <div className="text-sm text-slate-400">${portfolio?.totalBalance ? (parseFloat(portfolio.totalBalance) * 0.20).toLocaleString('en-US', {minimumFractionDigits: 2}) : '0.00'}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Bitcoin className="h-5 w-5 text-orange-500" />
                    <span>Crypto</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">10%</div>
                    <div className="text-sm text-slate-400">${portfolio?.totalBalance ? (parseFloat(portfolio.totalBalance) * 0.10).toLocaleString('en-US', {minimumFractionDigits: 2}) : '0.00'}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-slate-950 rounded-lg">
                  <div className="text-2xl font-bold text-green-500">+{portfolio?.winRate ? parseFloat(portfolio.winRate).toFixed(1) : '0.0'}%</div>
                  <div className="text-sm text-slate-400">Total Return</div>
                </div>
                <div className="text-center p-4 bg-slate-950 rounded-lg">
                  <div className="text-2xl font-bold">${portfolio?.todayPL ? parseFloat(portfolio.todayPL).toLocaleString('en-US', {minimumFractionDigits: 2}) : '0.00'}</div>
                  <div className="text-sm text-slate-400">Today's P&L</div>
                </div>
                <div className="text-center p-4 bg-slate-950 rounded-lg">
                  <div className="text-2xl font-bold">{portfolio?.activeAlgorithms || 0}</div>
                  <div className="text-sm text-slate-400">Active Strategies</div>
                </div>
                <div className="text-center p-4 bg-slate-950 rounded-lg">
                  <div className="text-2xl font-bold text-blue-500">A+</div>
                  <div className="text-sm text-slate-400">Risk Grade</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle>Recent Portfolio Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <div className="font-medium">Forex Algorithm Activated</div>
                    <div className="text-sm text-slate-400">EUR/USD strategy started</div>
                  </div>
                </div>
                <div className="text-sm text-slate-400">2 hours ago</div>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <div className="font-medium">Portfolio Rebalanced</div>
                    <div className="text-sm text-slate-400">Asset allocation updated</div>
                  </div>
                </div>
                <div className="text-sm text-slate-400">1 day ago</div>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div>
                    <div className="font-medium">Gold Position Closed</div>
                    <div className="text-sm text-slate-400">+$1,250 profit realized</div>
                  </div>
                </div>
                <div className="text-sm text-slate-400">2 days ago</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  function renderTrades() {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Trade History</h2>
          <div className="flex items-center space-x-4">
            <Select>
              <SelectTrigger className="w-40 bg-slate-900 border-slate-700">
                <SelectValue placeholder="All Algorithms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Algorithms</SelectItem>
                <SelectItem value="forex">Forex</SelectItem>
                <SelectItem value="gold">Gold</SelectItem>
                <SelectItem value="stocks">Stocks</SelectItem>
                <SelectItem value="crypto">Crypto</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Trade Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Total Trades</span>
                <History className="h-5 w-5 text-blue-500" />
              </div>
              <div className="text-2xl font-bold">1,247</div>
              <div className="text-sm text-green-500">+18 this week</div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Win Rate</span>
                <Target className="h-5 w-5 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-green-500">82.4%</div>
              <div className="text-sm text-slate-400">1,027 wins</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Avg. Profit</span>
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              <div className="text-2xl font-bold">$245.50</div>
              <div className="text-sm text-green-500">+5.2% vs last month</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Best Day</span>
                <Plus className="h-5 w-5 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-green-500">+$3,250</div>
              <div className="text-sm text-slate-400">Jan 15, 2024</div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Trade Table */}
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle>Recent Trades</CardTitle>
          </CardHeader>
          <CardContent>
            {tradesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-700">
                      <th className="text-left py-3">Date</th>
                      <th className="text-left py-3">Instrument</th>
                      <th className="text-left py-3">Algorithm</th>
                      <th className="text-left py-3">Type</th>
                      <th className="text-left py-3">Entry</th>
                      <th className="text-left py-3">Exit</th>
                      <th className="text-right py-3">Size</th>
                      <th className="text-right py-3">P&L</th>
                      <th className="text-right py-3">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Demo trade data since no trades exist yet */}
                    <tr className="border-b border-slate-800">
                      <td className="py-3 text-slate-400">Jan 26, 2025</td>
                      <td className="py-3 font-medium">EUR/USD</td>
                      <td className="py-3">
                        <div className="flex items-center space-x-2">
                          <Coins className="h-4 w-4 text-yellow-500" />
                          <span>Forex</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-500">BUY</span>
                      </td>
                      <td className="py-3">1.05432</td>
                      <td className="py-3">1.05687</td>
                      <td className="py-3 text-right">0.5 lots</td>
                      <td className="py-3 text-right">
                        <span className="text-green-500">+$127.50</span>
                      </td>
                      <td className="py-3 text-right text-slate-400">2h 15m</td>
                    </tr>
                    <tr className="border-b border-slate-800">
                      <td className="py-3 text-slate-400">Jan 26, 2025</td>
                      <td className="py-3 font-medium">XAU/USD</td>
                      <td className="py-3">
                        <div className="flex items-center space-x-2">
                          <Gem className="h-4 w-4 text-yellow-400" />
                          <span>Gold</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-500">SELL</span>
                      </td>
                      <td className="py-3">2,050.25</td>
                      <td className="py-3">2,048.10</td>
                      <td className="py-3 text-right">0.1 oz</td>
                      <td className="py-3 text-right">
                        <span className="text-green-500">+$215.00</span>
                      </td>
                      <td className="py-3 text-right text-slate-400">4h 32m</td>
                    </tr>
                    <tr className="border-b border-slate-800">
                      <td className="py-3 text-slate-400">Jan 25, 2025</td>
                      <td className="py-3 font-medium">BTC/USD</td>
                      <td className="py-3">
                        <div className="flex items-center space-x-2">
                          <Bitcoin className="h-4 w-4 text-orange-500" />
                          <span>Crypto</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-500">BUY</span>
                      </td>
                      <td className="py-3">103,450</td>
                      <td className="py-3">104,120</td>
                      <td className="py-3 text-right">0.02 BTC</td>
                      <td className="py-3 text-right">
                        <span className="text-green-500">+$13.40</span>
                      </td>
                      <td className="py-3 text-right text-slate-400">1h 45m</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  function renderAnalytics() {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Performance Analytics</h2>
          <div className="flex items-center space-x-4">
            <Select>
              <SelectTrigger className="w-40 bg-slate-900 border-slate-700">
                <SelectValue placeholder="Last 30 days" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Key Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Sharpe Ratio</span>
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              <div className="text-2xl font-bold">2.45</div>
              <div className="text-sm text-green-500">Excellent performance</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Max Drawdown</span>
                <Target className="h-5 w-5 text-red-500" />
              </div>
              <div className="text-2xl font-bold text-red-500">-8.2%</div>
              <div className="text-sm text-slate-400">Within safe limits</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Profit Factor</span>
                <ChartLine className="h-5 w-5 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-green-500">3.2</div>
              <div className="text-sm text-green-500">Strong profitability</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Avg Trade Duration</span>
                <Bot className="h-5 w-5 text-blue-400" />
              </div>
              <div className="text-2xl font-bold">2.8h</div>
              <div className="text-sm text-slate-400">Optimal timing</div>
            </CardContent>
          </Card>
        </div>

        {/* Algorithm Performance Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle>Algorithm Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Coins className="h-6 w-6 text-yellow-500" />
                    <div>
                      <div className="font-medium">Forex Algorithm</div>
                      <div className="text-sm text-slate-400">EUR/USD, GBP/USD, USD/JPY</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-green-500">+24.5%</div>
                    <div className="text-sm text-slate-400">Win Rate: 84.2%</div>
                  </div>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div className="bg-gradient-to-r from-yellow-500 to-green-500 h-2 rounded-full" style={{width: '84%'}}></div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Gem className="h-6 w-6 text-yellow-400" />
                    <div>
                      <div className="font-medium">Gold Algorithm</div>
                      <div className="text-sm text-slate-400">XAU/USD precious metals</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-green-500">+18.7%</div>
                    <div className="text-sm text-slate-400">Win Rate: 76.8%</div>
                  </div>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div className="bg-gradient-to-r from-yellow-400 to-green-500 h-2 rounded-full" style={{width: '77%'}}></div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <BarChart3 className="h-6 w-6 text-green-500" />
                    <div>
                      <div className="font-medium">Stocks Algorithm</div>
                      <div className="text-sm text-slate-400">S&P 500, NASDAQ indices</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-green-500">+15.3%</div>
                    <div className="text-sm text-slate-400">Win Rate: 72.1%</div>
                  </div>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full" style={{width: '72%'}}></div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Bitcoin className="h-6 w-6 text-orange-500" />
                    <div>
                      <div className="font-medium">Crypto Algorithm</div>
                      <div className="text-sm text-slate-400">BTC, ETH, major altcoins</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-green-500">+31.2%</div>
                    <div className="text-sm text-slate-400">Win Rate: 68.9%</div>
                  </div>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full" style={{width: '69%'}}></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle>Risk Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-400">Overall Risk Score</span>
                    <span className="text-sm font-medium text-green-500">Low Risk</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-3">
                    <div className="bg-gradient-to-r from-green-500 to-yellow-500 h-3 rounded-full" style={{width: '35%'}}></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-slate-950 rounded-lg">
                    <div className="text-lg font-bold">2.1%</div>
                    <div className="text-xs text-slate-400">Daily VaR</div>
                  </div>
                  <div className="text-center p-4 bg-slate-950 rounded-lg">
                    <div className="text-lg font-bold">0.85</div>
                    <div className="text-xs text-slate-400">Beta</div>
                  </div>
                  <div className="text-center p-4 bg-slate-950 rounded-lg">
                    <div className="text-lg font-bold">12.4%</div>
                    <div className="text-xs text-slate-400">Volatility</div>
                  </div>
                  <div className="text-center p-4 bg-slate-950 rounded-lg">
                    <div className="text-lg font-bold">0.92</div>
                    <div className="text-xs text-slate-400">Correlation</div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-700">
                  <h4 className="font-medium mb-3">Risk Distribution</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">Market Risk</span>
                      <span className="text-sm">65%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">Currency Risk</span>
                      <span className="text-sm">20%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">Liquidity Risk</span>
                      <span className="text-sm">10%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">Other Risks</span>
                      <span className="text-sm">5%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Performance */}
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle>Monthly Performance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-700">
                    <th className="text-left py-3">Month</th>
                    <th className="text-right py-3">Return</th>
                    <th className="text-right py-3">Trades</th>
                    <th className="text-right py-3">Win Rate</th>
                    <th className="text-right py-3">Sharpe</th>
                    <th className="text-right py-3">Max DD</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-800">
                    <td className="py-3 font-medium">January 2025</td>
                    <td className="py-3 text-right text-green-500">+8.4%</td>
                    <td className="py-3 text-right">284</td>
                    <td className="py-3 text-right">81.7%</td>
                    <td className="py-3 text-right">2.31</td>
                    <td className="py-3 text-right text-red-500">-3.2%</td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-3 font-medium">December 2024</td>
                    <td className="py-3 text-right text-green-500">+12.1%</td>
                    <td className="py-3 text-right">312</td>
                    <td className="py-3 text-right">85.3%</td>
                    <td className="py-3 text-right">2.87</td>
                    <td className="py-3 text-right text-red-500">-2.1%</td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-3 font-medium">November 2024</td>
                    <td className="py-3 text-right text-green-500">+6.8%</td>
                    <td className="py-3 text-right">298</td>
                    <td className="py-3 text-right">78.9%</td>
                    <td className="py-3 text-right">2.45</td>
                    <td className="py-3 text-right text-red-500">-4.7%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  function renderAlgorithm(algorithmType: string) {
    const algorithmData = {
      forex: {
        name: 'Forex Algorithm',
        icon: Coins,
        color: 'text-yellow-500',
        pairs: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD'],
        performance: '+24.5%',
        winRate: '84.2%',
        trades: '1,247',
        description: 'Advanced AI-powered forex trading algorithm focusing on major currency pairs with high liquidity and tight spreads.'
      },
      gold: {
        name: 'Gold Algorithm',
        icon: Gem,
        color: 'text-yellow-400',
        pairs: ['XAU/USD', 'XAU/EUR', 'XAU/GBP'],
        performance: '+18.7%',
        winRate: '76.8%',
        trades: '623',
        description: 'Specialized precious metals trading algorithm leveraging market volatility and economic indicators for optimal entry and exit points.'
      },
      stocks: {
        name: 'Stocks Algorithm',
        icon: BarChart3,
        color: 'text-green-500',
        pairs: ['S&P 500', 'NASDAQ', 'DOW', 'Russell 2000'],
        performance: '+15.3%',
        winRate: '72.1%',
        trades: '892',
        description: 'Equity and index trading algorithm analyzing market trends, earnings reports, and technical indicators for profitable trades.'
      },
      crypto: {
        name: 'Crypto Algorithm',
        icon: Bitcoin,
        color: 'text-orange-500',
        pairs: ['BTC/USD', 'ETH/USD', 'ADA/USD', 'DOT/USD'],
        performance: '+31.2%',
        winRate: '68.9%',
        trades: '1,456',
        description: 'Cryptocurrency trading algorithm designed for high-volatility digital assets with advanced risk management and momentum strategies.'
      }
    };

    const algo = algorithmData[algorithmType as keyof typeof algorithmData];
    const IconComponent = algo.icon;

    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <IconComponent className={`h-8 w-8 ${algo.color}`} />
            <div>
              <h2 className="text-2xl font-bold">{algo.name}</h2>
              <p className="text-slate-400">{algo.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
              <Settings className="mr-2 h-4 w-4" />
              Configure
            </Button>
          </div>
        </div>

        {/* Algorithm Performance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Total Return</span>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-green-500">{algo.performance}</div>
              <div className="text-sm text-slate-400">Since inception</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Win Rate</span>
                <Target className="h-5 w-5 text-blue-500" />
              </div>
              <div className="text-2xl font-bold">{algo.winRate}</div>
              <div className="text-sm text-green-500">Above market average</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Total Trades</span>
                <History className="h-5 w-5 text-blue-400" />
              </div>
              <div className="text-2xl font-bold">{algo.trades}</div>
              <div className="text-sm text-slate-400">Executed trades</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Status</span>
                <Bot className="h-5 w-5 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-green-500">Active</div>
              <div className="text-sm text-slate-400">Running smoothly</div>
            </CardContent>
          </Card>
        </div>

        {/* Trading Pairs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle>Active Trading Pairs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {algo.pairs.map((pair, index) => (
                  <div key={pair} className="flex items-center justify-between p-4 bg-slate-950 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <IconComponent className={`h-5 w-5 ${algo.color}`} />
                      <div>
                        <div className="font-medium">{pair}</div>
                        <div className="text-sm text-slate-400">
                          {algorithmType === 'forex' && 'Major currency pair'}
                          {algorithmType === 'gold' && 'Precious metals'}
                          {algorithmType === 'stocks' && 'Market index'}
                          {algorithmType === 'crypto' && 'Digital asset'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-500">
                        +{(Math.random() * 10 + 5).toFixed(1)}%
                      </div>
                      <div className="text-xs text-slate-400">30-day return</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle>Algorithm Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Risk Level</span>
                  <span className="text-green-500">Conservative</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Max Position Size</span>
                  <span className="text-white">5% of portfolio</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Stop Loss</span>
                  <span className="text-white">2%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Take Profit</span>
                  <span className="text-white">6%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Auto Rebalance</span>
                  <span className="text-green-500">Enabled</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Trading Hours</span>
                  <span className="text-white">24/7</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Algorithm Activity */}
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <div className="font-medium">Position Opened</div>
                    <div className="text-sm text-slate-400">{algo.pairs[0]} - BUY signal detected</div>
                  </div>
                </div>
                <div className="text-sm text-slate-400">5 minutes ago</div>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <div className="font-medium">Position Closed</div>
                    <div className="text-sm text-slate-400">{algo.pairs[1]} - Take profit reached (+$247.50)</div>
                  </div>
                </div>
                <div className="text-sm text-slate-400">12 minutes ago</div>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div>
                    <div className="font-medium">Risk Alert</div>
                    <div className="text-sm text-slate-400">Volatility increased - adjusting position sizes</div>
                  </div>
                </div>
                <div className="text-sm text-slate-400">1 hour ago</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  function renderHelp() {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-6">Help Center</h2>
        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="p-6">
            <p className="text-slate-400">Help documentation and support coming soon...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  function renderSettings() {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Account Settings</h2>
        </div>
        
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
