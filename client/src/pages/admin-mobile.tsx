import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  ChevronRight
} from "lucide-react";

const menuItems = [
  { id: 'overview', label: 'Overview', icon: Home, color: 'text-blue-600' },
  { id: 'trades', label: 'Trade Management', icon: TrendingUp, color: 'text-red-600' },
  { id: 'deposits', label: 'Deposit Requests', icon: DollarSign, color: 'text-yellow-600' },
  { id: 'users', label: 'User Management', icon: Users, color: 'text-orange-600' },
  { id: 'crypto', label: 'Crypto Addresses', icon: Wallet, color: 'text-green-600' },
  { id: 'settings', label: 'Website Settings', icon: Settings, color: 'text-purple-600' },
];

export default function AdminMobile() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [balanceAction, setBalanceAction] = useState({ type: 'add', amount: '' });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSectionChange = (sectionId: string) => {
    if (sectionId === activeSection) return;
    setActiveSection(sectionId);
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

  // Balance adjustment mutation
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
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update trade P&L");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ 
        title: "Success!", 
        description: "Trade P&L updated successfully!",
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Update Failed", 
        description: error.message,
        variant: "destructive" 
      });
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

  // Crypto addresses state and mutations
  const [newAddress, setNewAddress] = useState({ symbol: '', name: '', address: '', network: '' });

  const { data: cryptoAddresses = [], refetch: cryptoRefetch } = useQuery({
    queryKey: ["/api/admin/crypto-addresses"],
    enabled: isAuthenticated
  });

  const addCryptoMutation = useMutation({
    mutationFn: async (address: typeof newAddress) => {
      const response = await fetch("/api/admin/crypto-addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(address),
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to add crypto address");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/crypto-addresses"] });
      setNewAddress({ symbol: '', name: '', address: '', network: '' });
      toast({
        title: "Crypto Address Added",
        description: "New crypto address has been added successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Add Address",
        description: error.message,
        variant: "destructive",
      });
    },
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
              className="flex items-center space-x-2"
            >
              <Button
                variant="outline"
                size="sm"
                className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                onClick={() => window.location.href = '/'}
              >
                <Home className="h-4 w-4 mr-1" />
                User Dashboard
              </Button>
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

                  <motion.div 
                    whileHover={{ scale: 1.05, rotate: -1 }} 
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card className="bg-gradient-to-br from-green-500 via-green-600 to-green-700 text-white border-0 shadow-xl">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-green-100 text-sm font-medium">Total Revenue</p>
                            <p className="text-2xl font-bold">${(stats as any)?.totalRevenue || '0'}</p>
                            <div className="w-12 h-1 bg-green-300 rounded-full mt-2"></div>
                          </div>
                          <div className="bg-green-400/30 p-3 rounded-xl">
                            <DollarSign className="h-8 w-8 text-green-100" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div 
                    whileHover={{ scale: 1.05, rotate: 1 }} 
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Card className="bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 text-white border-0 shadow-xl">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-orange-100 text-sm font-medium">Pending Trades</p>
                            <p className="text-3xl font-bold">{pendingTrades.length}</p>
                            <div className="w-12 h-1 bg-orange-300 rounded-full mt-2"></div>
                          </div>
                          <div className="bg-orange-400/30 p-3 rounded-xl">
                            <Clock className="h-8 w-8 text-orange-100" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div 
                    whileHover={{ scale: 1.05, rotate: -1 }} 
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Card className="bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 text-white border-0 shadow-xl">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-purple-100 text-sm font-medium">Active Trades</p>
                            <p className="text-3xl font-bold">{approvedTrades.length}</p>
                            <div className="w-12 h-1 bg-purple-300 rounded-full mt-2"></div>
                          </div>
                          <div className="bg-purple-400/30 p-3 rounded-xl">
                            <TrendingUp className="h-8 w-8 text-purple-100" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              </>
            )}

            {activeSection === 'trades' && (
              <Card className="shadow-xl">
                <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 border-b">
                  <CardTitle className="flex items-center text-xl">
                    <TrendingUp className="h-6 w-6 mr-3 text-red-600" />
                    Trade Management System
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {Array.isArray(trades) && trades.length > 0 ? (
                      trades.slice(0, 10).map((trade: any) => (
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
                                <Badge variant={trade.type === 'buy' ? 'default' : 'destructive'} className="text-xs font-semibold">
                                  {trade.type.toUpperCase()}
                                </Badge>
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

                            {/* Trade Management Controls */}
                            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                              {trade.adminApproval === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => approveTradesMutation.mutate({
                                      userId: trade.userId,
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
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No trades found</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === 'deposits' && (
              <Card className="shadow-xl">
                <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b">
                  <CardTitle className="flex items-center text-xl">
                    <DollarSign className="h-6 w-6 mr-3 text-yellow-600" />
                    Deposit Requests Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {Array.isArray(depositRequests) && depositRequests.length > 0 ? (
                      depositRequests.map((deposit: any) => (
                        <motion.div
                          key={deposit.id}
                          whileHover={{ scale: 1.01 }}
                          className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl shadow-md"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-1">
                                <p className="font-semibold text-lg">
                                  ${parseFloat(deposit.usdValue || deposit.amount || '0').toLocaleString('en-US', {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 2
                                  })}
                                </p>
                                <Badge className="bg-orange-100 text-orange-800 font-semibold">
                                  {deposit.cryptoSymbol || deposit.cryptocurrency}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">
                                {parseFloat(deposit.amount || '0').toFixed(
                                  deposit.cryptoSymbol === 'BTC' ? 8 : 
                                  deposit.cryptoSymbol === 'ETH' ? 6 : 2
                                )} {deposit.cryptoSymbol || deposit.cryptocurrency}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(deposit.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                            <Badge variant="outline" className={`${
                              deposit.status === 'approved' ? 'bg-green-100 text-green-800' :
                              deposit.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {deposit.status}
                            </Badge>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No deposit requests</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === 'users' && (
              <Card className="shadow-xl">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-yellow-50 border-b">
                  <CardTitle className="flex items-center text-xl">
                    <Users className="h-6 w-6 mr-3 text-orange-600" />
                    User Management System
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {Array.isArray(users) && users.length > 0 ? (
                      users.map((user: any) => (
                        <motion.div
                          key={user.id}
                          whileHover={{ scale: 1.01 }}
                          className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl shadow-md hover:shadow-lg transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <span className="font-bold text-lg text-gray-900">{user.firstName} {user.lastName}</span>
                                <Badge variant={user.isActive ? 'default' : 'destructive'} className="text-xs">
                                  {user.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                                {user.isAdmin && (
                                  <Badge variant="outline" className="text-orange-700 border-orange-300">
                                    Admin
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-gray-600 space-y-1">
                                <p><span className="font-medium">Email:</span> {user.email}</p>
                                <p><span className="font-medium">Username:</span> {user.username}</p>
                                <p><span className="font-medium">Joined:</span> {new Date(user.createdAt).toLocaleDateString()}</p>
                                <p><span className="font-medium">Last Login:</span> {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}</p>
                              </div>
                            </div>
                            <div className="flex flex-col space-y-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-4 py-2"
                                    onClick={() => setSelectedUser(user)}
                                  >
                                    <Edit2 className="h-4 w-4 mr-1" />
                                    Manage
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white shadow-2xl border-4 border-orange-200">
                                  <DialogHeader className="bg-gradient-to-r from-orange-100 to-yellow-100 -m-6 mb-6 p-6 border-b-2 border-orange-200">
                                    <DialogTitle className="text-2xl font-bold text-orange-800 flex items-center">
                                      <Users className="h-6 w-6 mr-3" />
                                      Manage User: {user.firstName} {user.lastName}
                                    </DialogTitle>
                                  </DialogHeader>
                                  
                                  {userDetails && (
                                    <div className="space-y-6">
                                      {/* User Info Section */}
                                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-xl border-2 border-gray-200">
                                        <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center">
                                          <Users className="h-5 w-5 mr-2 text-orange-600" />
                                          User Information
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                          <div>
                                            <span className="font-medium text-gray-600">Email:</span>
                                            <p className="font-semibold text-gray-900">{userDetails.email}</p>
                                          </div>
                                          <div>
                                            <span className="font-medium text-gray-600">Username:</span>
                                            <p className="font-semibold text-gray-900">{userDetails.username}</p>
                                          </div>
                                          <div>
                                            <span className="font-medium text-gray-600">Registration IP:</span>
                                            <p className="font-mono text-gray-800">{userDetails.registrationIp || 'N/A'}</p>
                                          </div>
                                          <div>
                                            <span className="font-medium text-gray-600">Last Login IP:</span>
                                            <p className="font-mono text-gray-800">{userDetails.lastLoginIp || 'N/A'}</p>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Balance Management Section */}
                                      <div className="bg-gradient-to-r from-green-50 to-emerald-100 p-6 rounded-xl border-2 border-green-200">
                                        <h3 className="font-bold text-lg text-green-800 mb-4 flex items-center">
                                          <DollarSign className="h-5 w-5 mr-2" />
                                          Balance Management
                                        </h3>
                                        <div className="space-y-4">
                                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="bg-white p-4 rounded-lg border border-green-300">
                                              <p className="text-sm text-green-600 font-medium">Current Balance</p>
                                              <p className="text-2xl font-bold text-green-800">
                                                ${parseFloat(userDetails.portfolio?.totalBalance || '0').toLocaleString()}
                                              </p>
                                            </div>
                                            <div className="bg-white p-4 rounded-lg border border-green-300">
                                              <p className="text-sm text-green-600 font-medium">Total Deposits</p>
                                              <p className="text-lg font-semibold text-green-700">
                                                ${parseFloat(userDetails.portfolio?.totalDeposits || '0').toLocaleString()}
                                              </p>
                                            </div>
                                            <div className="bg-white p-4 rounded-lg border border-green-300">
                                              <p className="text-sm text-green-600 font-medium">Total Profit</p>
                                              <p className="text-lg font-semibold text-green-700">
                                                ${parseFloat(userDetails.portfolio?.totalProfit || '0').toLocaleString()}
                                              </p>
                                            </div>
                                          </div>
                                          
                                          {/* Balance Adjustment Controls */}
                                          <div className="flex flex-wrap gap-3 p-4 bg-white rounded-lg border-2 border-green-300">
                                            <div className="flex space-x-2 flex-1 min-w-64">
                                              <select
                                                value={balanceAction.type}
                                                onChange={(e) => setBalanceAction({ ...balanceAction, type: e.target.value })}
                                                className="px-3 py-2 border border-green-300 rounded-md bg-white text-sm font-medium"
                                              >
                                                <option value="add">Add Balance</option>
                                                <option value="subtract">Subtract Balance</option>
                                                <option value="profit">Add Profit</option>
                                              </select>
                                              <Input
                                                type="number"
                                                placeholder="Amount"
                                                value={balanceAction.amount}
                                                onChange={(e) => setBalanceAction({ ...balanceAction, amount: e.target.value })}
                                                className="flex-1 border-green-300 focus:border-green-500"
                                              />
                                              <Button
                                                onClick={() => adjustBalanceMutation.mutate({
                                                  userId: user.id,
                                                  amount: parseFloat(balanceAction.amount),
                                                  type: balanceAction.type
                                                })}
                                                disabled={adjustBalanceMutation.isPending || !balanceAction.amount}
                                                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4"
                                              >
                                                {adjustBalanceMutation.isPending ? (
                                                  <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                  balanceAction.type === 'add' ? <Plus className="h-4 w-4" /> :
                                                  balanceAction.type === 'subtract' ? <Minus className="h-4 w-4" /> :
                                                  <TrendingUp className="h-4 w-4" />
                                                )}
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* User's Recent Trades */}
                                      <div className="bg-gradient-to-r from-blue-50 to-indigo-100 p-6 rounded-xl border-2 border-blue-200">
                                        <h3 className="font-bold text-lg text-blue-800 mb-4 flex items-center">
                                          <BarChart3 className="h-5 w-5 mr-2" />
                                          Recent Trading Activity
                                        </h3>
                                        <div className="space-y-3 max-h-64 overflow-y-auto">
                                          {userDetails.trades && userDetails.trades.length > 0 ? (
                                            userDetails.trades.slice(0, 5).map((trade: any) => (
                                              <div key={trade.id} className="bg-white p-3 rounded-lg border border-blue-200 shadow-sm">
                                                <div className="flex items-center justify-between">
                                                  <div className="flex items-center space-x-3">
                                                    <Badge variant={trade.type === 'buy' ? 'default' : 'destructive'} className="text-xs">
                                                      {trade.type}
                                                    </Badge>
                                                    <span className="font-semibold">{trade.symbol}</span>
                                                    <span className="text-sm text-gray-600">{trade.quantity} shares</span>
                                                  </div>
                                                  <div className="text-right">
                                                    <p className="font-semibold">${parseFloat(trade.totalAmount || '0').toFixed(2)}</p>
                                                    <p className={`text-xs ${parseFloat(trade.profitLoss || '0') >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                      P&L: ${parseFloat(trade.profitLoss || '0').toFixed(2)}
                                                    </p>
                                                  </div>
                                                </div>
                                              </div>
                                            ))
                                          ) : (
                                            <p className="text-center text-blue-600 py-4">No recent trades found</p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No users found</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === 'crypto' && (
              <Card className="shadow-xl">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                  <CardTitle className="flex items-center text-xl">
                    <Wallet className="h-6 w-6 mr-3 text-green-600" />
                    Crypto Addresses Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {/* Add New Address Form */}
                  <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-200">
                    <h3 className="font-semibold text-green-800 mb-3 flex items-center">
                      <Plus className="h-5 w-5 mr-2" />
                      Add New Crypto Address
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input
                        placeholder="Symbol (e.g., BTC)"
                        value={newAddress.symbol}
                        onChange={(e) => setNewAddress({...newAddress, symbol: e.target.value})}
                        className="bg-white border-green-300 focus:border-green-500"
                      />
                      <Input
                        placeholder="Name (e.g., Bitcoin)"
                        value={newAddress.name}
                        onChange={(e) => setNewAddress({...newAddress, name: e.target.value})}
                        className="bg-white border-green-300 focus:border-green-500"
                      />
                      <Input
                        placeholder="Network (e.g., Mainnet)"
                        value={newAddress.network}
                        onChange={(e) => setNewAddress({...newAddress, network: e.target.value})}
                        className="bg-white border-green-300 focus:border-green-500"
                      />
                      <Input
                        placeholder="Wallet Address"
                        value={newAddress.address}
                        onChange={(e) => setNewAddress({...newAddress, address: e.target.value})}
                        className="bg-white border-green-300 focus:border-green-500"
                      />
                    </div>
                    <Button
                      onClick={() => addCryptoMutation.mutate(newAddress)}
                      disabled={addCryptoMutation.isPending || !newAddress.symbol || !newAddress.address}
                      className="mt-3 bg-green-600 hover:bg-green-700 text-white"
                    >
                      {addCryptoMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Address
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Existing Addresses */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-800 flex items-center">
                      <Wallet className="h-5 w-5 mr-2 text-green-600" />
                      Current Crypto Addresses
                    </h3>
                    {Array.isArray(cryptoAddresses) && cryptoAddresses.length > 0 ? (
                      cryptoAddresses.map((address: any) => (
                        <motion.div
                          key={address.id}
                          whileHover={{ scale: 1.01 }}
                          className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl shadow-md"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <Badge className="bg-green-100 text-green-800 font-semibold">
                                  {address.symbol}
                                </Badge>
                                <span className="font-medium text-gray-800">{address.name}</span>
                                <Badge variant="outline" className="text-green-700 border-green-300">
                                  {address.network}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 font-mono bg-white/70 p-2 rounded border">
                                {address.address}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No crypto addresses configured yet</p>
                        <p className="text-sm text-gray-400 mt-1">Add addresses above to get started</p>
                      </div>
                    )}
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