import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { Home, TrendingUp, PieChart, Settings, User, Menu, ChevronDown, BarChart3, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import Landing from "@/pages/landing";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import Wallets from "@/pages/wallets";
import Portfolio from "@/pages/portfolio";
import TradingPage from "@/pages/trading";
import MarketsPage from "@/pages/markets";
import OrdersPage from "@/pages/orders";
import SettingsPage from "@/pages/settings";
import AdminLogin from "@/pages/admin-login";
import AdminMobile from "@/pages/admin-mobile";
import AdminTest from "@/pages/admin-test";
import AdminSimple from "@/pages/admin-simple";
import AdminTrades from "@/pages/admin-trades";
import NotFound from "@/pages/not-found";

function MobileNav() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [showTradeOptions, setShowTradeOptions] = useState(false);
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Logout failed");
      }
    },
    onSuccess: () => {
      toast({
        title: "Logged Out Successfully",
        description: "You have been logged out of your account.",
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setTimeout(() => {
        window.location.href = "/auth";
      }, 1000);
    },
    onError: (error: Error) => {
      toast({
        title: "Logout Failed",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
    setIsOpen(false);
  };
  
  const navItems = [
    { href: "/", icon: Home, label: "Dashboard" },
    { href: "/wallets", icon: TrendingUp, label: "Wallets" },
    { href: "/portfolio", icon: PieChart, label: "Portfolio" },
    { href: "/settings", icon: Settings, label: "Settings" },
  ];

  const tradingOptions = [
    { href: "/markets", label: "Markets", icon: BarChart3 },
    { href: "/trading", label: "Trade", icon: TrendingUp },
    { href: "/orders", label: "My Orders", icon: PieChart },
  ];

  const handleNavClick = () => {
    setIsOpen(false);
    setShowTradeOptions(false);
  };

  return (
    <div className="lg:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-200">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <SheetDescription className="sr-only">Navigate to different sections of the app</SheetDescription>
          <div className="flex flex-col space-y-4 mt-8">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={handleNavClick}>
                <div className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  location === item.href ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100'
                }`}>
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </div>
              </Link>
            ))}
            
            {/* Live Trade Section */}
            <div>
              <button
                onClick={() => setShowTradeOptions(!showTradeOptions)}
                className={`w-full flex items-center justify-between space-x-3 p-3 rounded-lg transition-all duration-200 ease-in-out ${
                  ['/trading', '/markets', '/orders'].includes(location) ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100'
                } hover:scale-105`}
              >
                <div className="flex items-center space-x-3">
                  <PieChart className="h-5 w-5" />
                  <span className="font-medium">Live Trade</span>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform duration-300 ease-in-out ${showTradeOptions ? 'rotate-180' : ''}`} />
              </button>
              
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showTradeOptions ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="ml-4 mt-2 space-y-2">
                  {tradingOptions.map((option, index) => (
                    <Link key={option.label} href={option.href} onClick={handleNavClick}>
                      <div 
                        className="flex items-center space-x-3 p-2 rounded-lg text-gray-600 hover:bg-green-50 hover:text-green-700 transition-all duration-200 transform hover:translate-x-1"
                        style={{
                          animationDelay: showTradeOptions ? `${index * 50}ms` : '0ms',
                          animation: showTradeOptions ? 'slideInLeft 0.3s ease-out forwards' : 'none'
                        }}
                      >
                        <option.icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{option.label}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Admin Section */}
            {isAdmin && (
              <div>
                <Link href="/admin/dashboard" onClick={handleNavClick}>
                  <div className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                    location.startsWith('/admin') ? 'bg-red-100 text-red-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}>
                    <Shield className="h-5 w-5" />
                    <span className="font-medium">Admin</span>
                  </div>
                </Link>
              </div>
            )}

            <div className="border-t pt-4">
              <Button
                variant="ghost"
                className="w-full flex items-center justify-start space-x-3 p-3 rounded-lg text-gray-600 hover:bg-gray-100 h-auto"
                onClick={handleLogout}
              >
                <User className="h-5 w-5" />
                <span className="font-medium">Logout</span>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function DesktopNav() {
  const [location] = useLocation();
  const { isAdmin } = useAuth();
  
  const navItems = [
    { href: "/", icon: Home, label: "Dashboard" },
    { href: "/wallets", icon: TrendingUp, label: "Wallets" },
    { href: "/portfolio", icon: PieChart, label: "Portfolio" },
    { href: "/settings", icon: Settings, label: "Settings" },
  ];

  const tradingOptions = [
    { href: "/markets", label: "Markets" },
    { href: "/trading", label: "Trade" },
    { href: "/orders", label: "My Orders" },
  ];

  return (
    <nav className="hidden lg:flex items-center space-x-8">
      {navItems.map((item) => (
        <Link key={item.href} href={item.href}>
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
            location === item.href ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100'
          }`}>
            <item.icon className="h-4 w-4" />
            <span className="font-medium text-sm">{item.label}</span>
          </div>
        </Link>
      ))}
      
      {/* Live Trade Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ease-in-out ${
            ['/trading', '/markets', '/orders'].includes(location) ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100'
          } hover:scale-105`}>
            <PieChart className="h-4 w-4" />
            <span className="font-medium text-sm">Live Trade</span>
            <ChevronDown className="h-3 w-3 transition-transform duration-200 data-[state=open]:rotate-180" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="start" 
          className="w-40 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200"
        >
          <DropdownMenuItem asChild className="cursor-pointer hover:bg-green-50 transition-colors">
            <Link href="/markets">
              <span className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Markets</span>
              </span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer hover:bg-green-50 transition-colors">
            <Link href="/trading">
              <span className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span>Trade</span>
              </span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer hover:bg-green-50 transition-colors">
            <Link href="/orders">
              <span className="flex items-center space-x-2">
                <PieChart className="h-4 w-4" />
                <span>My Orders</span>
              </span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Admin Section */}
      {isAdmin && (
        <Link href="/admin/dashboard">
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
            location.startsWith('/admin') ? 'bg-red-100 text-red-700' : 'text-gray-600 hover:bg-gray-100'
          }`}>
            <Shield className="h-4 w-4" />
            <span className="font-medium text-sm">Admin</span>
          </div>
        </Link>
      )}
    </nav>
  );
}

function AppHeader() {
  const { user } = useAuth();
  const { toast } = useToast();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Logout failed");
      }
    },
    onSuccess: () => {
      toast({
        title: "Logged Out Successfully",
        description: "You have been logged out of your account.",
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setTimeout(() => {
        window.location.href = "/auth";
      }, 1000);
    },
    onError: (error: Error) => {
      toast({
        title: "Logout Failed",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">Bitrader</span>
              </div>
            </Link>
            <DesktopNav />
          </div>
          
          <div className="flex items-center space-x-4">
            <MobileNav />
            <div className="hidden sm:flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                    T
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Trader</div>
                  <div className="text-xs text-green-600 flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                    Online
                  </div>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                className="hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
              >
                {logoutMutation.isPending ? "Logging out..." : "Logout"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();

  console.log("Router state:", { user, isAuthenticated, isLoading });

  return (
    <Switch>
      {/* Admin routes - always accessible */}
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminMobile} />
      <Route path="/admin/test" component={AdminTest} />
      <Route path="/admin/simple" component={AdminSimple} />
      <Route path="/admin/trades" component={AdminTrades} />
      <Route path="/admin" component={AdminTest} />
      <Route path="/admin/mobile" component={AdminMobile} />
      
      {/* User authentication routes */}
      <Route path="/auth">
        {isAuthenticated ? (
          <Route path="/" component={Dashboard} />
        ) : (
          <AuthPage />
        )}
      </Route>
      
      {/* Protected user routes */}
      {isLoading ? (
        <Route path="/">
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          </div>
        </Route>
      ) : isAuthenticated ? (
        <>
          <div className="min-h-screen bg-gray-50">
            <AppHeader />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <Route path="/" component={Dashboard} />
              <Route path="/wallets" component={Wallets} />
              <Route path="/trading" component={TradingPage} />
              <Route path="/markets" component={MarketsPage} />
              <Route path="/orders" component={OrdersPage} />
              <Route path="/portfolio" component={Portfolio} />
              <Route path="/settings" component={SettingsPage} />
            </main>
          </div>
        </>
      ) : (
        <Route path="/" component={Landing} />
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
