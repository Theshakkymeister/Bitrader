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
                            <div>
                              <p className="font-semibold">${deposit.amount}</p>
                              <p className="text-sm text-gray-600">{deposit.cryptocurrency}</p>
                            </div>
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
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
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}