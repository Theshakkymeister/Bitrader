import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { Home, TrendingUp, PieChart, Settings, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";

function MobileNav() {
  const [location] = useLocation();
  
  const navItems = [
    { href: "/", icon: Home, label: "Portfolio" },
    { href: "/trading", icon: TrendingUp, label: "Trading" },
    { href: "/analytics", icon: PieChart, label: "Analytics" },
    { href: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="lg:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64">
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
    { href: "/", icon: Home, label: "Portfolio" },
    { href: "/trading", icon: TrendingUp, label: "Trading" },
    { href: "/analytics", icon: PieChart, label: "Analytics" },
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
            <div className="hidden sm:flex items-center space-x-3">
              <div className="text-sm text-gray-600">
                Welcome, {user?.firstName || 'Trader'}
              </div>
              <a href="/api/logout">
                <Button variant="outline" size="sm">
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
              <Route path="/trading" component={() => <div className="text-center py-20 text-gray-500">Trading page coming soon</div>} />
              <Route path="/analytics" component={() => <div className="text-center py-20 text-gray-500">Analytics page coming soon</div>} />
              <Route path="/settings" component={() => <div className="text-center py-20 text-gray-500">Settings page coming soon</div>} />
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
