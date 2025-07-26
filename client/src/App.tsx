import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { Home, TrendingUp, PieChart, Settings, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Wallets from "@/pages/wallets";
import Portfolio from "@/pages/portfolio";
import SettingsPage from "@/pages/settings";
import NotFound from "@/pages/not-found";

function MobileNav() {
  const [location] = useLocation();
  
  const navItems = [
    { href: "/", icon: Home, label: "Dashboard" },
    { href: "/wallets", icon: TrendingUp, label: "Wallets" },
    { href: "/portfolio", icon: PieChart, label: "Portfolio" },
    { href: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="lg:hidden">
      <Sheet>
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
              <Link key={item.href} href={item.href}>
                <div className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  location === item.href ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100'
                }`}>
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </div>
              </Link>
            ))}
            <div className="border-t pt-4">
              <a href="/api/logout" className="flex items-center space-x-3 p-3 rounded-lg text-gray-600 hover:bg-gray-100">
                <User className="h-5 w-5" />
                <span className="font-medium">Logout</span>
              </a>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function DesktopNav() {
  const [location] = useLocation();
  
  const navItems = [
    { href: "/", icon: Home, label: "Dashboard" },
    { href: "/wallets", icon: TrendingUp, label: "Wallets" },
    { href: "/portfolio", icon: PieChart, label: "Portfolio" },
    { href: "/settings", icon: Settings, label: "Settings" },
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
    </nav>
  );
}

function AppHeader() {
  const { user } = useAuth();

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
              <a href="/api/logout">
                <Button variant="outline" size="sm" className="hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors">
                  Logout
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <div className="min-h-screen bg-gray-50">
            <AppHeader />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <Route path="/" component={Dashboard} />
              <Route path="/wallets" component={Wallets} />
              <Route path="/portfolio" component={Portfolio} />
              <Route path="/settings" component={SettingsPage} />
            </main>
          </div>
        </>
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
