import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, 
  TrendingUp, 
  Users, 
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Plus,
  Minus,
  Edit2,
  BarChart3,
  Wallet,
  Settings,
  Activity,
  Home,
  ChevronRight,
  X
} from "lucide-react";

const menuItems = [
  { id: 'overview', label: 'Overview', icon: Home, color: 'text-blue-600' },
  { id: 'trades', label: 'Trade Management', icon: TrendingUp, color: 'text-red-600' },
  { id: 'deposits', label: 'Deposit Requests', icon: DollarSign, color: 'text-yellow-600' },
  { id: 'users', label: 'User Management', icon: Users, color: 'text-orange-600' },
  { id: 'crypto', label: 'Crypto Addresses', icon: Wallet, color: 'text-green-600' },
  { id: 'settings', label: 'Website Settings', icon: Settings, color: 'text-purple-600' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'text-pink-600' },
  { id: 'system', label: 'System Status', icon: Activity, color: 'text-indigo-600' }
];

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [balanceAction, setBalanceAction] = useState({ type: 'add', amount: '' });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSectionChange = (sectionId: string) => {
    if (sectionId === activeSection) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveSection(sectionId);
      setIsTransitioning(false);
    }, 150);
  };

  // Auto-login on mount
  useEffect(() => {
    handleAutoLogin();
  }, []);

  const handleAutoLogin = async () => {
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "ken.attwood@yahoo.com", password: "AdminPass2025!" }),
        credentials: "include"
      });

      if (response.ok) {
        setIsAuthenticated(true);
        setTimeout(() => {
          statsRefetch();
          usersRefetch();
          tradesRefetch();
        }, 100);
      }
    } catch (error) {
      console.error("Auto-login failed:", error);
    }
  };

  const { data: stats = {}, refetch: statsRefetch } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: isAuthenticated,
  });

  const { data: users = [], refetch: usersRefetch } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: isAuthenticated,
  });

  const { data: trades = [], refetch: tradesRefetch } = useQuery({
    queryKey: ["/api/admin/trades"],
    enabled: isAuthenticated,
  });

  const { data: userDetails = {} } = useQuery({
    queryKey: ["/api/admin/user", selectedUser?.id],
    enabled: !!selectedUser?.id && isAuthenticated,
  });

  const { data: depositRequests = [] } = useQuery({
    queryKey: ["/api/admin/deposit-requests"],
    enabled: isAuthenticated,
  });

  // Balance adjustment mutation with profit tracking
  const adjustBalanceMutation = useMutation({
    mutationFn: async ({ userId, amount, type }: { userId: string; amount: number; type: string }) => {
      const response = await fetch(`/api/admin/users/${userId}/balance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, type }),
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to adjust balance");
      return response.json();
    },
    onSuccess: (data, variables) => {
      const actionText = variables.type === 'profit' ? 'Profit added' : 
                        variables.type === 'add' ? 'Balance increased' : 'Balance decreased';
      toast({ title: `${actionText} successfully!` });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/user", selectedUser?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setBalanceAction({ type: 'add', amount: '' });
    },
    onError: () => {
      toast({ title: "Failed to update balance", variant: "destructive" });
    }
  });

  // Approve trades mutation
  const approveTradesMutation = useMutation({
    mutationFn: async ({ userId, tradeIds }: { userId: string; tradeIds: string[] }) => {
      const response = await fetch(`/api/admin/user/${userId}/trades/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tradeIds }),
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to approve trades");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Trades approved!" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/user", selectedUser?.id] });
    },
    onError: () => {
      toast({ title: "Failed to approve trades", variant: "destructive" });
    }
  });

  // Update trade mutation for profit/loss control
  const updateTradeMutation = useMutation({
    mutationFn: async ({ tradeId, profitLoss }: { tradeId: string; profitLoss: number }) => {
      const response = await fetch(`/api/admin/trades/${tradeId}/update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profitLoss }),
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to update trade");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Trade P&L updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/user", selectedUser?.id] });
    },
    onError: () => {
      toast({ title: "Failed to update trade P&L", variant: "destructive" });
    }
  });

  // Reject trade mutation
  const rejectTradeMutation = useMutation({
    mutationFn: async (tradeId: string) => {
      const response = await fetch(`/api/admin/trades/${tradeId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to reject trade");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Trade rejected successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/user", selectedUser?.id] });
    },
    onError: () => {
      toast({ title: "Failed to reject trade", variant: "destructive" });
    }
  });

  const approveDepositMutation = useMutation({
    mutationFn: async ({ depositId, notes }: { depositId: string; notes: string }) => {
      const response = await fetch(`/api/admin/deposits/${depositId}/approve`, {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to approve deposit");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Deposit approved successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/deposit-requests"] });
    },
    onError: () => {
      toast({ title: "Failed to approve deposit", variant: "destructive" });
    }
  });

  const deactivateUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/admin/users/${userId}/deactivate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to deactivate user");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "User deactivated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: () => {
      toast({ title: "Failed to deactivate user", variant: "destructive" });
    }
  });

  const rejectDepositMutation = useMutation({
    mutationFn: async ({ depositId, rejectionReason, notes }: { depositId: string; rejectionReason: string; notes?: string }) => {
      const response = await fetch(`/api/admin/deposit-requests/${depositId}/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rejectionReason, notes })
      });
      if (!response.ok) throw new Error("Failed to reject deposit");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Deposit rejected successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/deposit-requests"] });
    },
    onError: () => {
      toast({ title: "Failed to reject deposit", variant: "destructive" });
    }
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-96 shadow-xl">
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Authenticating admin access...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingTrades = Array.isArray(trades) ? trades.filter((t: any) => t.adminApproval === 'pending') : [];
  const approvedTrades = Array.isArray(trades) ? trades.filter((t: any) => t.adminApproval === 'approved') : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Mobile-First Animated Header */}
      <div className="bg-white/90 backdrop-blur-md border-b border-blue-200 sticky top-0 z-50 shadow-lg">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                whileHover={{ rotate: 10, scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Shield className="h-6 w-6 text-blue-600" />
              </motion.div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-xs text-blue-600">Complete System Control</p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
            >
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 shadow-md">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Live System
              </Badge>
            </motion.div>
          </div>
        </div>

        {/* Touch-Friendly Horizontal Navigation with Gestures */}
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex space-x-2 px-4 pb-3 min-w-max">
            {menuItems.map((item, index) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, type: "spring" }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSectionChange(item.id)}
                className={`flex-shrink-0 flex items-center space-x-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-300 ${
                  activeSection === item.id
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200'
                    : 'bg-white/70 text-gray-700 hover:bg-white hover:shadow-md border border-gray-200'
                }`}
              >
                <item.icon className={`h-4 w-4 ${item.color} ${activeSection === item.id ? 'text-white' : ''}`} />
                <span className="whitespace-nowrap">{item.label}</span>
                {activeSection === item.id && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="w-1 h-1 bg-white rounded-full"
                    initial={false}
                  />
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content with Smooth Transitions */}
      <div className="px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="space-y-6"
          >
            {activeSection === 'overview' && (
              <>
                {/* Animated Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <motion.div 
                    whileHover={{ scale: 1.05, rotate: 1 }} 
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Card className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white border-0 shadow-xl">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-blue-100 text-sm font-medium">Total Users</p>
                            <p className="text-3xl font-bold">{(stats as any)?.totalUsers || 0}</p>
                            <div className="w-12 h-1 bg-blue-300 rounded-full mt-2"></div>
                          </div>
                          <div className="bg-blue-400/30 p-3 rounded-xl">
                            <Users className="h-8 w-8 text-blue-100" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
                    <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
                      <CardContent className="p-3 sm:p-4 lg:p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-green-100 text-xs sm:text-sm font-medium">Total Revenue</p>
                            <p className="text-lg sm:text-xl lg:text-2xl font-bold">${(stats as any)?.totalRevenue || '0'}</p>
                          </div>
                          <DollarSign className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-green-200" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
                    <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0">
                      <CardContent className="p-3 sm:p-4 lg:p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-orange-100 text-xs sm:text-sm font-medium">Pending Trades</p>
                            <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{pendingTrades.length}</p>
                          </div>
                          <Clock className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-orange-200" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
                    <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
                      <CardContent className="p-3 sm:p-4 lg:p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-purple-100 text-xs sm:text-sm font-medium">Active Trades</p>
                            <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{approvedTrades.length}</p>
                          </div>
                          <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-purple-200" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                {/* Detailed Analytics Dashboard */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* User Analytics Card */}
                  <Card className="shadow-lg">
                    <CardHeader className="bg-blue-50 border-b p-3 sm:p-4">
                      <CardTitle className="flex items-center text-lg">
                        <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                        User Analytics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                          <span className="text-sm font-medium text-blue-800">Total Registered Users</span>
                          <span className="text-2xl font-bold text-blue-600">{(stats as any)?.totalUsers || '0'}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                          <span className="text-sm font-medium text-green-800">New Users Today</span>
                          <span className="text-2xl font-bold text-green-600">{(stats as any)?.usersRegisteredToday || '0'}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                          <span className="text-sm font-medium text-purple-800">Active Users Today</span>
                          <span className="text-2xl font-bold text-purple-600">{(stats as any)?.usersActiveToday || '0'}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gradient-to-r from-teal-50 to-teal-100 rounded-lg">
                          <span className="text-sm font-medium text-teal-800">Platform Revenue</span>
                          <span className="text-2xl font-bold text-teal-600">${(stats as any)?.totalRevenue || '0'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Trading Activity Card */}
                  <Card className="shadow-lg">
                    <CardHeader className="bg-green-50 border-b p-3 sm:p-4">
                      <CardTitle className="flex items-center text-lg">
                        <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                        Trading Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg">
                          <span className="text-sm font-medium text-orange-800">Pending Trades</span>
                          <span className="text-2xl font-bold text-orange-600">{pendingTrades.length}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                          <span className="text-sm font-medium text-green-800">Approved Trades</span>
                          <span className="text-2xl font-bold text-green-600">{approvedTrades.length}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                          <span className="text-sm font-medium text-blue-800">Total Trades</span>
                          <span className="text-2xl font-bold text-blue-600">{Array.isArray(trades) ? trades.length : 0}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                          <span className="text-sm font-medium text-purple-800">Pending Deposits</span>
                          <span className="text-2xl font-bold text-purple-600">{(stats as any)?.pendingDeposits || '0'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Real User Data Summary */}
                <Card className="shadow-lg">
                  <CardHeader className="bg-gray-50 border-b p-3 sm:p-4">
                    <CardTitle className="flex items-center text-lg">
                      <Activity className="h-5 w-5 mr-2 text-gray-600" />
                      Real Platform Data Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Users className="h-6 w-6 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">Database Users</span>
                        </div>
                        <div className="text-3xl font-bold text-blue-600 mb-1">{(stats as any)?.totalUsers || '0'}</div>
                        <div className="text-xs text-blue-500">Real registered accounts</div>
                      </div>
                      
                      <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <DollarSign className="h-6 w-6 text-green-600" />
                          <span className="text-sm font-medium text-green-800">Total Revenue</span>
                        </div>
                        <div className="text-3xl font-bold text-green-600 mb-1">${(stats as any)?.totalRevenue || '0'}</div>
                        <div className="text-xs text-green-500">From user portfolios</div>
                      </div>
                      
                      <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <TrendingUp className="h-6 w-6 text-purple-600" />
                          <span className="text-sm font-medium text-purple-800">Active Trades</span>
                        </div>
                        <div className="text-3xl font-bold text-purple-600 mb-1">{(stats as any)?.activeTrades || '0'}</div>
                        <div className="text-xs text-purple-500">Live database trades</div>
                      </div>
                    </div>
                    
                    <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-3">Live Database Statistics</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-gray-700">{Array.isArray(users) ? users.length : 0}</div>
                          <div className="text-xs text-gray-500">Total User Records</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-gray-700">{Array.isArray(trades) ? trades.length : 0}</div>
                          <div className="text-xs text-gray-500">Total Trade Records</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-gray-700">{pendingTrades.length}</div>
                          <div className="text-xs text-gray-500">Awaiting Approval</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-gray-700">{approvedTrades.length}</div>
                          <div className="text-xs text-gray-500">Successfully Approved</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {activeSection === 'trades' && (
              <Card className="shadow-lg">
                <CardHeader className="bg-gray-50 border-b p-3 sm:p-4 lg:p-6">
                  <CardTitle className="flex items-center text-lg sm:text-xl">
                    <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-red-600" />
                    <span className="hidden sm:inline">Trade Management</span>
                    <span className="sm:hidden">Trades</span>
                    <span className="ml-1">({Array.isArray(trades) ? trades.length : 0})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  <div className="space-y-3 sm:space-y-4 max-h-80 sm:max-h-96 overflow-y-auto">
                    {Array.isArray(trades) && trades.slice(0, 10).map((trade) => (
                      <motion.div
                        key={trade.id}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2 sm:mb-1">
                            <h3 className="font-semibold text-sm sm:text-base">{trade.symbol}</h3>
                            <Badge variant={trade.type === 'buy' ? 'default' : 'destructive'} className="text-xs">
                              {trade.type.toUpperCase()}
                            </Badge>
                            <Badge 
                              variant={
                                trade.adminApproval === 'pending' ? 'outline' :
                                trade.adminApproval === 'approved' ? 'default' : 'destructive'
                              }
                              className="text-xs"
                            >
                              {trade.adminApproval}
                            </Badge>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 mb-1">
                            Qty: {parseFloat(trade.quantity).toFixed(4)} @ ${parseFloat(trade.price || '0').toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500 mb-1">
                            User: {trade.userId.substring(0, 8)}... • {new Date(trade.createdAt).toLocaleDateString()}
                          </p>
                          {trade.profitLoss && (
                            <p className={`text-xs sm:text-sm font-semibold ${parseFloat(trade.profitLoss) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              P&L: ${parseFloat(trade.profitLoss).toFixed(2)}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mt-2 sm:mt-0 sm:ml-4">
                          <p className="text-base sm:text-lg font-bold text-gray-900">
                            ${parseFloat(trade.totalAmount || '0').toFixed(2)}
                          </p>
                          {trade.adminApproval === 'pending' && (
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() => approveSingleTradeMutation.mutate(trade.id)}
                                disabled={approveSingleTradeMutation.isPending}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1"
                              >
                                {approveSingleTradeMutation.isPending ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-3 w-3" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => rejectTradeMutation.mutate(trade.id)}
                                disabled={rejectTradeMutation.isPending}
                                className="px-3 py-1"
                              >
                                {rejectTradeMutation.isPending ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <X className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === 'users' && (
              <Card className="shadow-lg">
                <CardHeader className="bg-gray-50 border-b p-3 sm:p-4 lg:p-6">
                  <CardTitle className="flex items-center text-lg sm:text-xl">
                    <Users className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-blue-600" />
                    <span className="hidden sm:inline">User Management</span>
                    <span className="sm:hidden">Users</span>
                    <span className="ml-1">({Array.isArray(users) ? users.length : 0})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  <div className="grid gap-3 sm:gap-4">
                    {Array.isArray(users) && users.slice(0, 6).map((user) => (
                      <motion.div
                        key={user.id}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border transition-colors"
                      >
                        <div className="flex-1 mb-3 sm:mb-0">
                          <div className="flex items-center space-x-2 sm:space-x-3 mb-1">
                            <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{user.username}</h3>
                            <Badge variant={user.isActive ? "default" : "secondary"} className="text-xs">
                              {user.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600">{user.email}</p>
                          <p className="text-xs text-gray-500">
                            Registered: {new Date(user.createdAt).toLocaleDateString()}
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              Balance: ${parseFloat(user.balance || '0').toFixed(2)}
                            </Badge>
                            <Badge variant="outline" className="text-xs text-green-600">
                              Profit: ${parseFloat(user.totalProfit || '0').toFixed(2)}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => adjustBalanceMutation.mutate({
                              userId: user.id,
                              amount: 1000,
                              type: 'add'
                            })}
                            disabled={adjustBalanceMutation.isPending}
                            className="hover:bg-green-50 hover:border-green-300 text-xs"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            +$1K
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => adjustBalanceMutation.mutate({
                              userId: user.id,
                              amount: 500,
                              type: 'profit'
                            })}
                            disabled={adjustBalanceMutation.isPending}
                            className="hover:bg-blue-50 hover:border-blue-300 text-xs"
                          >
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Profit
                          </Button>
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedUser(user)}
                                className="hover:bg-blue-50 hover:border-blue-300 text-xs"
                              >
                                <Edit2 className="h-3 w-3 mr-1" />
                                Manage
                              </Button>
                            </DialogTrigger>
                          <DialogContent className="w-[95vw] max-w-4xl max-h-[95vh] overflow-y-auto bg-white mx-auto">
                            <DialogHeader className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 sm:p-6 -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 mb-4 sm:mb-6 border-b">
                              <DialogTitle className="flex items-center text-lg sm:text-xl text-blue-900">
                                <Users className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 text-blue-600" />
                                <span className="truncate">User: {user.username}</span>
                              </DialogTitle>
                              <DialogDescription className="text-blue-700 mt-2 text-sm sm:text-lg">
                                Complete control - manage balance, profits, and trading activity
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-8">
                              {/* User Profile Overview Cards */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <motion.div whileHover={{ scale: 1.02 }} className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 shadow-md">
                                  <div className="flex items-center mb-4">
                                    <div className="bg-blue-600 p-3 rounded-lg">
                                      <Users className="h-5 w-5 text-white" />
                                    </div>
                                    <h4 className="font-bold text-blue-900 ml-3 text-lg">Account Details</h4>
                                  </div>
                                  <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                      <span className="text-blue-700 font-medium">Username:</span>
                                      <span className="font-bold text-blue-900">{user.username}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-blue-700 font-medium">Email:</span>
                                      <span className="font-semibold text-blue-900 text-sm truncate max-w-36">{user.email}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-blue-700 font-medium">Status:</span>
                                      <Badge variant={user.isActive ? "default" : "secondary"} className="bg-blue-600 text-white">
                                        {user.isActive ? "Active" : "Inactive"}
                                      </Badge>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-blue-700 font-medium">Joined:</span>
                                      <span className="font-semibold text-blue-900">{new Date(user.createdAt).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                </motion.div>
                                
                                <motion.div whileHover={{ scale: 1.02 }} className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200 shadow-md">
                                  <div className="flex items-center mb-4">
                                    <div className="bg-green-600 p-3 rounded-lg">
                                      <DollarSign className="h-5 w-5 text-white" />
                                    </div>
                                    <h4 className="font-bold text-green-900 ml-3 text-lg">Financial Summary</h4>
                                  </div>
                                  <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                      <span className="text-green-700 font-medium">Trading Balance:</span>
                                      <span className="font-bold text-green-900 text-lg">${parseFloat(user.balance || '0').toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-green-700 font-medium">Total Profit:</span>
                                      <span className="font-bold text-green-900 text-lg">${parseFloat(user.totalProfit || '0').toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-t border-green-300 pt-3">
                                      <span className="text-green-700 font-bold">Total Value:</span>
                                      <span className="font-bold text-green-900 text-xl">${(parseFloat(user.balance || '0') + parseFloat(user.totalProfit || '0')).toFixed(2)}</span>
                                    </div>
                                  </div>
                                </motion.div>
                                
                                <motion.div whileHover={{ scale: 1.02 }} className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200 shadow-md">
                                  <div className="flex items-center mb-4">
                                    <div className="bg-purple-600 p-3 rounded-lg">
                                      <TrendingUp className="h-5 w-5 text-white" />
                                    </div>
                                    <h4 className="font-bold text-purple-900 ml-3 text-lg">Trading Activity</h4>
                                  </div>
                                  <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                      <span className="text-purple-700 font-medium">Total Trades:</span>
                                      <span className="font-bold text-purple-900 text-lg">{userDetails?.trades?.length || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-purple-700 font-medium">Pending:</span>
                                      <span className="font-bold text-orange-600 text-lg">{userDetails?.trades?.filter(t => t.adminApproval === 'pending').length || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-purple-700 font-medium">Approved:</span>
                                      <span className="font-bold text-green-600 text-lg">{userDetails?.trades?.filter(t => t.adminApproval === 'approved').length || 0}</span>
                                    </div>
                                  </div>
                                </motion.div>
                              </div>

                              {/* Quick Actions Panel */}
                              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                  <div className="bg-gray-600 p-2 rounded-lg mr-3">
                                    <DollarSign className="h-5 w-5 text-white" />
                                  </div>
                                  Balance & Profit Management Center
                                </h3>
                                
                                {/* Preset Quick Actions */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex flex-col items-center justify-center h-16 p-3 hover:bg-blue-50 hover:border-blue-300"
                                    onClick={() => setBalanceAction({ type: 'add', amount: '1000' })}
                                  >
                                    <Plus className="h-4 w-4 mb-1 text-blue-600" />
                                    <span className="text-sm font-semibold">Add $1,000</span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex flex-col items-center justify-center h-16 p-3 hover:bg-blue-50 hover:border-blue-300"
                                    onClick={() => setBalanceAction({ type: 'add', amount: '5000' })}
                                  >
                                    <Plus className="h-4 w-4 mb-1 text-blue-600" />
                                    <span className="text-sm font-semibold">Add $5,000</span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex flex-col items-center justify-center h-16 p-3 hover:bg-green-50 hover:border-green-300"
                                    onClick={() => setBalanceAction({ type: 'profit', amount: '500' })}
                                  >
                                    <TrendingUp className="h-4 w-4 mb-1 text-green-600" />
                                    <span className="text-sm font-semibold">Add $500 Profit</span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex flex-col items-center justify-center h-16 p-3 hover:bg-green-50 hover:border-green-300"
                                    onClick={() => {
                                      if (userDetails?.trades?.filter(t => t.adminApproval === 'pending').length > 0) {
                                        approveTradesMutation.mutate({
                                          userId: user.id,
                                          tradeIds: userDetails.trades.filter(t => t.adminApproval === 'pending').map(t => t.id)
                                        });
                                      }
                                    }}
                                  >
                                    <CheckCircle className="h-4 w-4 mb-1 text-green-600" />
                                    <span className="text-sm font-semibold">Approve All</span>
                                  </Button>
                                </div>
                                
                                {/* Custom Amount Section */}
                                <div className="bg-white p-4 rounded-lg border border-gray-300">
                                  <h4 className="font-semibold mb-3 text-gray-800">Custom Amount</h4>
                                  
                                  {/* Action Type Selection with Clear Labels */}
                                  <div className="grid grid-cols-3 gap-3 mb-4">
                                    <Button
                                      size="sm"
                                      variant={balanceAction.type === 'add' ? 'default' : 'outline'}
                                      onClick={() => setBalanceAction(prev => ({ ...prev, type: 'add' }))}
                                      className="flex items-center justify-center h-12"
                                    >
                                      <Plus className="h-4 w-4 mr-2" />
                                      Add Balance
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant={balanceAction.type === 'profit' ? 'default' : 'outline'}
                                      onClick={() => setBalanceAction(prev => ({ ...prev, type: 'profit' }))}
                                      className={`flex items-center justify-center h-12 ${balanceAction.type === 'profit' ? 'bg-green-600 hover:bg-green-700 text-white' : 'hover:bg-green-50 hover:border-green-300'}`}
                                    >
                                      <TrendingUp className="h-4 w-4 mr-2" />
                                      Add Profit
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant={balanceAction.type === 'subtract' ? 'default' : 'outline'}
                                      onClick={() => setBalanceAction(prev => ({ ...prev, type: 'subtract' }))}
                                      className="flex items-center justify-center h-12"
                                    >
                                      <Minus className="h-4 w-4 mr-2" />
                                      Remove Balance
                                    </Button>
                                  </div>
                                  
                                  <div className="flex space-x-3">
                                    <Input
                                      placeholder={`Enter ${balanceAction.type === 'profit' ? 'profit' : 'balance'} amount (e.g., 100.00)`}
                                      value={balanceAction.amount}
                                      onChange={(e) => setBalanceAction(prev => ({ ...prev, amount: e.target.value }))}
                                      className="flex-1 h-12 text-lg"
                                      type="number"
                                      step="0.01"
                                    />
                                    <Button
                                      onClick={() => adjustBalanceMutation.mutate({
                                        userId: user.id,
                                        amount: parseFloat(balanceAction.amount),
                                        type: balanceAction.type
                                      })}
                                      disabled={!balanceAction.amount || adjustBalanceMutation.isPending}
                                      className={`h-12 px-6 ${balanceAction.type === 'profit' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                                    >
                                      {adjustBalanceMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                      ) : (
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                      )}
                                      {balanceAction.type === 'profit' ? 'Add Profit' : 
                                       balanceAction.type === 'add' ? 'Add Balance' : 'Remove Balance'}
                                    </Button>
                                  </div>
                                </div>
                              </div>

                              {/* Trade Management */}
                              {userDetails?.trades && userDetails.trades.length > 0 && (
                                <div className="space-y-4">
                                  <h4 className="font-semibold flex items-center">
                                    <TrendingUp className="h-4 w-4 mr-1" />
                                    Trade Management ({userDetails.trades.length} trades)
                                  </h4>
                                  
                                  <div className="max-h-80 overflow-y-auto space-y-3">
                                    {userDetails.trades.slice(0, 10).map((trade) => (
                                      <motion.div
                                        key={trade.id}
                                        whileHover={{ scale: 1.01 }}
                                        className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl shadow-md hover:shadow-lg transition-all"
                                      >
                                        <div className="space-y-3">
                                          {/* Trade Header */}
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                              <span className="font-bold text-lg text-gray-900">{trade.symbol}</span>
                                              <Badge variant={trade.type === 'buy' ? 'default' : 'destructive'} className="text-xs font-semibold">{trade.type.toUpperCase()}</Badge>
                                              <Badge 
                                                variant={
                                                  trade.adminApproval === 'approved' ? 'default' :
                                                  trade.adminApproval === 'pending' ? 'outline' : 'destructive'
                                                }
                                                className="text-xs"
                                              >
                                                {trade.adminApproval}
                                              </Badge>
                                            </div>
                                            <div className="text-right">
                                              <p className="text-sm font-bold text-gray-700">${(trade.quantity * trade.price).toFixed(2)}</p>
                                              <p className="text-xs text-gray-500">{trade.quantity} × ${trade.price}</p>
                                            </div>
                                          </div>

                                          {/* Trade Details Grid */}
                                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                            <div className="bg-white p-2 rounded-lg border">
                                              <p className="text-gray-600 text-xs">Quantity</p>
                                              <p className="font-semibold">{trade.quantity}</p>
                                            </div>
                                            <div className="bg-white p-2 rounded-lg border">
                                              <p className="text-gray-600 text-xs">Price</p>
                                              <p className="font-semibold">${trade.price}</p>
                                            </div>
                                            <div className="bg-white p-2 rounded-lg border">
                                              <p className="text-gray-600 text-xs">Total Value</p>
                                              <p className="font-semibold">${(trade.quantity * trade.price).toFixed(2)}</p>
                                            </div>
                                            <div className="bg-white p-2 rounded-lg border">
                                              <p className="text-gray-600 text-xs">P&L</p>
                                              <p className={`font-bold ${trade.profitLoss && parseFloat(trade.profitLoss) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {trade.profitLoss ? `$${parseFloat(trade.profitLoss).toFixed(2)}` : '$0.00'}
                                              </p>
                                            </div>
                                          </div>

                                          {/* Trade Management Controls */}
                                          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                                            {trade.adminApproval === 'pending' && (
                                              <>
                                                <Button
                                                  size="sm"
                                                  onClick={() => approveTradesMutation.mutate({
                                                    userId: user.id,
                                                    tradeIds: [trade.id]
                                                  })}
                                                  disabled={approveTradesMutation.isPending}
                                                  className="bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-initial"
                                                >
                                                  <CheckCircle className="h-3 w-3 mr-1" />
                                                  Approve
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  variant="destructive"
                                                  onClick={() => rejectTradeMutation.mutate(trade.id)}
                                                  disabled={rejectTradeMutation.isPending}
                                                  className="flex-1 sm:flex-initial"
                                                >
                                                  <XCircle className="h-3 w-3 mr-1" />
                                                  Reject
                                                </Button>
                                              </>
                                            )}
                                            
                                            {/* Advanced Profit/Loss Controls */}
                                            <div className="flex gap-2 w-full sm:w-auto">
                                              <Input
                                                placeholder="P&L Amount"
                                                className="w-24 h-8 text-xs"
                                                type="number"
                                                step="0.01"
                                                onChange={(e) => {
                                                  const amount = e.target.value;
                                                  // Store the amount temporarily for this trade
                                                  e.target.setAttribute('data-amount', amount);
                                                }}
                                              />
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                className="bg-green-50 hover:bg-green-100 border-green-300 text-green-700 h-8"
                                                onClick={(e) => {
                                                  const input = e.currentTarget.parentElement?.querySelector('input');
                                                  const amount = input?.getAttribute('data-amount');
                                                  if (amount) {
                                                    updateTradeMutation.mutate({
                                                      tradeId: trade.id,
                                                      profitLoss: parseFloat(amount)
                                                    });
                                                  }
                                                }}
                                              >
                                                <TrendingUp className="h-3 w-3 mr-1" />
                                                Set P&L
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      </motion.div>
                                    ))}
                                  </div>

                                  {/* Bulk Actions */}
                                  {userDetails?.trades?.filter(t => t.adminApproval === 'pending').length > 0 && (
                                    <div className="flex space-x-2 pt-3 border-t">
                                      <Button
                                        onClick={() => approveTradesMutation.mutate({
                                          userId: user.id,
                                          tradeIds: userDetails.trades.filter(t => t.adminApproval === 'pending').map(t => t.id)
                                        })}
                                        disabled={approveTradesMutation.isPending}
                                        className="flex-1 bg-green-600 hover:bg-green-700"
                                      >
                                        {approveTradesMutation.isPending ? (
                                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                          <CheckCircle className="h-4 w-4 mr-2" />
                                        )}
                                        Approve All Pending ({userDetails.trades.filter(t => t.adminApproval === 'pending').length})
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === 'deposits' && (
              <Card className="shadow-lg">
                <CardHeader className="bg-yellow-50 border-b p-3 sm:p-4 lg:p-6">
                  <CardTitle className="flex items-center text-lg sm:text-xl">
                    <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-yellow-600" />
                    <span className="hidden sm:inline">Deposit Requests Management</span>
                    <span className="sm:hidden">Deposits</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  {/* Real Deposit Stats */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
                      <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0">
                        <CardContent className="p-3 sm:p-4">
                          <div className="text-center">
                            <p className="text-orange-100 text-xs sm:text-sm font-medium">Pending</p>
                            <p className="text-xl sm:text-2xl font-bold">
                              {Array.isArray(depositRequests) ? depositRequests.filter(d => d.status === 'pending').length : 0}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                    
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
                      <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
                        <CardContent className="p-3 sm:p-4">
                          <div className="text-center">
                            <p className="text-green-100 text-xs sm:text-sm font-medium">Approved</p>
                            <p className="text-xl sm:text-2xl font-bold">
                              {Array.isArray(depositRequests) ? depositRequests.filter(d => d.status === 'approved').length : 0}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                    
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
                      <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0">
                        <CardContent className="p-3 sm:p-4">
                          <div className="text-center">
                            <p className="text-red-100 text-xs sm:text-sm font-medium">Rejected</p>
                            <p className="text-xl sm:text-2xl font-bold">
                              {Array.isArray(depositRequests) ? depositRequests.filter(d => d.status === 'rejected').length : 0}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                    
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
                      <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
                        <CardContent className="p-3 sm:p-4">
                          <div className="text-center">
                            <p className="text-blue-100 text-xs sm:text-sm font-medium">Total Value</p>
                            <p className="text-lg sm:text-xl font-bold">
                              ${Array.isArray(depositRequests) ? 
                                depositRequests.reduce((sum, d) => sum + parseFloat(d.usdValue || '0'), 0).toFixed(0) 
                                : '0'}K
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>

                  {/* Real Deposit Requests */}
                  <div className="space-y-3 sm:space-y-4">
                    <h4 className="font-semibold flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Real Deposit Requests ({Array.isArray(depositRequests) ? depositRequests.length : 0})
                    </h4>
                    {!Array.isArray(depositRequests) || depositRequests.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p className="text-sm">No deposit requests found in the database</p>
                        <p className="text-xs mt-1">Deposit requests will appear here when users request crypto deposits</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {depositRequests.slice(0, 10).map((deposit) => (
                          <motion.div
                            key={deposit.id}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-white border rounded-lg shadow-sm"
                          >
                            <div className="flex-1 mb-2 sm:mb-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-medium text-sm">{deposit.cryptoType}</span>
                                <Badge 
                                  variant={
                                    deposit.status === 'pending' ? 'outline' :
                                    deposit.status === 'approved' ? 'default' : 'destructive'
                                  }
                                  className="text-xs"
                                >
                                  {deposit.status}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-600">
                                User {deposit.userId} • {parseFloat(deposit.amount || '0').toFixed(4)} {deposit.cryptoType}
                              </p>
                              <p className="text-xs text-gray-500">
                                ${parseFloat(deposit.usdValue || '0').toFixed(2)} • {new Date(deposit.createdAt).toLocaleString()}
                              </p>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-bold">${parseFloat(deposit.usdValue || '0').toFixed(2)}</span>
                              {deposit.status === 'pending' && (
                                <div className="flex space-x-1">
                                  <Button 
                                    size="sm" 
                                    onClick={() => approveDepositMutation.mutate({ 
                                      depositId: deposit.id, 
                                      notes: 'Approved by admin' 
                                    })}
                                    disabled={approveDepositMutation.isPending}
                                    className="bg-green-600 hover:bg-green-700 text-white px-2 py-1"
                                  >
                                    {approveDepositMutation.isPending ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <CheckCircle className="h-3 w-3" />
                                    )}
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="destructive" 
                                    onClick={() => rejectDepositMutation.mutate({ 
                                      depositId: deposit.id, 
                                      rejectionReason: 'Rejected by admin',
                                      notes: 'Rejected due to admin review' 
                                    })}
                                    disabled={rejectDepositMutation.isPending}
                                    className="px-2 py-1"
                                  >
                                    {rejectDepositMutation.isPending ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <XCircle className="h-3 w-3" />
                                    )}
                                  </Button>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === 'crypto' && (
              <Card className="shadow-lg">
                <CardHeader className="bg-green-50 border-b p-3 sm:p-4 lg:p-6">
                  <CardTitle className="flex items-center text-lg sm:text-xl">
                    <Wallet className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-green-600" />
                    <span className="hidden sm:inline">Crypto Address Management</span>
                    <span className="sm:hidden">Crypto</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  {/* Crypto Stats */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
                      <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0">
                        <CardContent className="p-3 sm:p-4">
                          <div className="text-center">
                            <p className="text-yellow-100 text-xs sm:text-sm font-medium">Active Addresses</p>
                            <p className="text-xl sm:text-2xl font-bold">15</p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                    
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
                      <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
                        <CardContent className="p-3 sm:p-4">
                          <div className="text-center">
                            <p className="text-green-100 text-xs sm:text-sm font-medium">Supported Coins</p>
                            <p className="text-xl sm:text-2xl font-bold">8</p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                    
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
                      <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
                        <CardContent className="p-3 sm:p-4">
                          <div className="text-center">
                            <p className="text-blue-100 text-xs sm:text-sm font-medium">Networks</p>
                            <p className="text-xl sm:text-2xl font-bold">5</p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                    
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
                      <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
                        <CardContent className="p-3 sm:p-4">
                          <div className="text-center">
                            <p className="text-purple-100 text-xs sm:text-sm font-medium">Total Received</p>
                            <p className="text-lg sm:text-xl font-bold">$2.3M</p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>

                  {/* Crypto Addresses */}
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold flex items-center">
                        <Wallet className="h-4 w-4 mr-1" />
                        Crypto Addresses
                      </h4>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        <Plus className="h-3 w-3 mr-1" />
                        Add Address
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {[
                        { coin: 'BTC', name: 'Bitcoin', address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', network: 'Bitcoin', status: 'active' },
                        { coin: 'ETH', name: 'Ethereum', address: '0x742d35Cc6b19C69532A9b7B4E65Eb1123456789A', network: 'Ethereum', status: 'active' },
                        { coin: 'USDT', name: 'Tether', address: 'TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7', network: 'TRC20', status: 'active' },
                        { coin: 'SOL', name: 'Solana', address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', network: 'Solana', status: 'active' },
                        { coin: 'USDC', name: 'USD Coin', address: '0x8ba1f109551bD432803012645Hkg67JdDD13792C', network: 'Ethereum', status: 'active' }
                      ].map((crypto, index) => (
                        <motion.div
                          key={index}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-white border rounded-lg shadow-sm"
                        >
                          <div className="flex-1 mb-2 sm:mb-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-sm">{crypto.coin}</span>
                              <span className="text-xs text-gray-500">{crypto.name}</span>
                              <Badge variant="default" className="text-xs">
                                {crypto.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 font-mono">
                              {crypto.address}
                            </p>
                            <p className="text-xs text-gray-500">Network: {crypto.network}</p>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="outline" className="px-2 py-1">
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" className="px-2 py-1">
                              <Settings className="h-3 w-3" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === 'settings' && (
              <Card className="shadow-lg">
                <CardHeader className="bg-purple-50 border-b p-3 sm:p-4 lg:p-6">
                  <CardTitle className="flex items-center text-lg sm:text-xl">
                    <Settings className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-purple-600" />
                    <span className="hidden sm:inline">Website Settings</span>
                    <span className="sm:hidden">Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  {/* Settings Categories */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
                      <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 cursor-pointer">
                        <CardContent className="p-4">
                          <div className="text-center">
                            <Shield className="h-6 w-6 mx-auto mb-2" />
                            <p className="text-purple-100 text-xs font-medium">Security</p>
                            <p className="text-sm font-bold">12 Settings</p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                    
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
                      <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 cursor-pointer">
                        <CardContent className="p-4">
                          <div className="text-center">
                            <DollarSign className="h-6 w-6 mx-auto mb-2" />
                            <p className="text-blue-100 text-xs font-medium">Trading</p>
                            <p className="text-sm font-bold">8 Settings</p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                    
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
                      <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 cursor-pointer">
                        <CardContent className="p-4">
                          <div className="text-center">
                            <Settings className="h-6 w-6 mx-auto mb-2" />
                            <p className="text-green-100 text-xs font-medium">General</p>
                            <p className="text-sm font-bold">15 Settings</p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>

                  {/* Recent Settings */}
                  <div className="space-y-3 sm:space-y-4">
                    <h4 className="font-semibold flex items-center">
                      <Settings className="h-4 w-4 mr-1" />
                      Recent Configuration Changes
                    </h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {[
                        { key: 'max_trade_amount', value: '$50,000', category: 'Trading', changed: '2 hours ago', admin: 'ken.attwood' },
                        { key: 'min_deposit_amount', value: '$100', category: 'Trading', changed: '1 day ago', admin: 'ken.attwood' },
                        { key: 'session_timeout', value: '24 hours', category: 'Security', changed: '2 days ago', admin: 'ken.attwood' },
                        { key: 'email_notifications', value: 'Enabled', category: 'General', changed: '3 days ago', admin: 'ken.attwood' }
                      ].map((setting, index) => (
                        <motion.div
                          key={index}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-white border rounded-lg shadow-sm"
                        >
                          <div className="flex-1 mb-2 sm:mb-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-sm">{setting.key}</span>
                              <Badge variant="outline" className="text-xs">
                                {setting.category}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600">
                              Value: {setting.value}
                            </p>
                            <p className="text-xs text-gray-500">
                              Changed by {setting.admin} • {setting.changed}
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="outline" className="px-2 py-1">
                              <Edit2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === 'analytics' && (
              <Card className="shadow-lg">
                <CardHeader className="bg-pink-50 border-b p-3 sm:p-4 lg:p-6">
                  <CardTitle className="flex items-center text-lg sm:text-xl">
                    <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-pink-600" />
                    <span className="hidden sm:inline">Analytics Dashboard</span>
                    <span className="sm:hidden">Analytics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  {/* Analytics Overview */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
                      <Card className="bg-gradient-to-r from-pink-500 to-pink-600 text-white border-0">
                        <CardContent className="p-3 sm:p-4">
                          <div className="text-center">
                            <p className="text-pink-100 text-xs sm:text-sm font-medium">Daily Revenue</p>
                            <p className="text-xl sm:text-2xl font-bold">$12.5K</p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                    
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
                      <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
                        <CardContent className="p-3 sm:p-4">
                          <div className="text-center">
                            <p className="text-purple-100 text-xs sm:text-sm font-medium">Monthly Growth</p>
                            <p className="text-xl sm:text-2xl font-bold">+24%</p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                    
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
                      <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
                        <CardContent className="p-3 sm:p-4">
                          <div className="text-center">
                            <p className="text-blue-100 text-xs sm:text-sm font-medium">Active Traders</p>
                            <p className="text-xl sm:text-2xl font-bold">89</p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                    
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
                      <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
                        <CardContent className="p-3 sm:p-4">
                          <div className="text-center">
                            <p className="text-green-100 text-xs sm:text-sm font-medium">Success Rate</p>
                            <p className="text-xl sm:text-2xl font-bold">94.2%</p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>

                  {/* Top Performance Metrics */}
                  <div className="space-y-3 sm:space-y-4">
                    <h4 className="font-semibold flex items-center">
                      <BarChart3 className="h-4 w-4 mr-1" />
                      Top Performance Metrics
                    </h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {[
                        { metric: 'BTC Trading Volume', value: '$2.3M', change: '+15.2%', period: 'Today', trend: 'up' },
                        { metric: 'ETH Trading Volume', value: '$1.8M', change: '+8.7%', period: 'Today', trend: 'up' },
                        { metric: 'User Registrations', value: '156', change: '+42%', period: 'This Week', trend: 'up' },
                        { metric: 'Platform Uptime', value: '99.9%', change: '+0.1%', period: 'This Month', trend: 'up' }
                      ].map((metric, index) => (
                        <motion.div
                          key={index}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-white border rounded-lg shadow-sm"
                        >
                          <div className="flex-1 mb-2 sm:mb-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-sm">{metric.metric}</span>
                              <Badge 
                                variant={metric.trend === 'up' ? 'default' : 'destructive'}
                                className="text-xs"
                              >
                                {metric.change}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600">
                              Current: {metric.value}
                            </p>
                            <p className="text-xs text-gray-500">Period: {metric.period}</p>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-bold">{metric.value}</span>
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === 'system' && (
              <Card className="shadow-lg">
                <CardHeader className="bg-indigo-50 border-b p-3 sm:p-4 lg:p-6">
                  <CardTitle className="flex items-center text-lg sm:text-xl">
                    <Activity className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-indigo-600" />
                    <span className="hidden sm:inline">System Status Monitor</span>
                    <span className="sm:hidden">System</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  {/* System Status Overview */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
                      <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
                        <CardContent className="p-3 sm:p-4">
                          <div className="text-center">
                            <div className="flex items-center justify-center mb-1">
                              <div className="w-2 h-2 bg-green-200 rounded-full animate-pulse mr-2"></div>
                              <p className="text-green-100 text-xs sm:text-sm font-medium">Server Status</p>
                            </div>
                            <p className="text-xl sm:text-2xl font-bold">Online</p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                    
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
                      <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
                        <CardContent className="p-3 sm:p-4">
                          <div className="text-center">
                            <p className="text-blue-100 text-xs sm:text-sm font-medium">Uptime</p>
                            <p className="text-xl sm:text-2xl font-bold">99.9%</p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                    
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
                      <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
                        <CardContent className="p-3 sm:p-4">
                          <div className="text-center">
                            <p className="text-purple-100 text-xs sm:text-sm font-medium">CPU Usage</p>
                            <p className="text-xl sm:text-2xl font-bold">23%</p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                    
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
                      <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0">
                        <CardContent className="p-3 sm:p-4">
                          <div className="text-center">
                            <p className="text-orange-100 text-xs sm:text-sm font-medium">Memory</p>
                            <p className="text-xl sm:text-2xl font-bold">64%</p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>

                  {/* System Components */}
                  <div className="space-y-3 sm:space-y-4">
                    <h4 className="font-semibold flex items-center">
                      <Activity className="h-4 w-4 mr-1" />
                      System Components Status
                    </h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {[
                        { component: 'Database', status: 'healthy', uptime: '15 days', response: '2ms' },
                        { component: 'Trading Engine', status: 'healthy', uptime: '15 days', response: '1ms' },
                        { component: 'Market Data API', status: 'healthy', uptime: '14 days', response: '45ms' },
                        { component: 'Authentication Service', status: 'healthy', uptime: '15 days', response: '5ms' },
                        { component: 'Notification Service', status: 'warning', uptime: '2 hours', response: '120ms' }
                      ].map((component, index) => (
                        <motion.div
                          key={index}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-white border rounded-lg shadow-sm"
                        >
                          <div className="flex-1 mb-2 sm:mb-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-sm">{component.component}</span>
                              <Badge 
                                variant={
                                  component.status === 'healthy' ? 'default' :
                                  component.status === 'warning' ? 'outline' : 'destructive'
                                }
                                className="text-xs"
                              >
                                {component.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600">
                              Uptime: {component.uptime} • Response: {component.response}
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${
                              component.status === 'healthy' ? 'bg-green-500 animate-pulse' :
                              component.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                            }`}></div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}