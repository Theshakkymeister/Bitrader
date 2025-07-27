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
  ChevronRight
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

export default function AdminTest() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [balanceAction, setBalanceAction] = useState({ type: 'add', amount: '' });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSectionChange = (sectionId) => {
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

  const { data: stats, refetch: statsRefetch } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: isAuthenticated,
  });

  const { data: users, refetch: usersRefetch } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: isAuthenticated,
  });

  const { data: trades, refetch: tradesRefetch } = useQuery({
    queryKey: ["/api/admin/trades"],
    enabled: isAuthenticated,
  });

  const { data: userDetails } = useQuery({
    queryKey: ["/api/admin/user", selectedUser?.id],
    enabled: !!selectedUser?.id && isAuthenticated,
  });

  // Balance adjustment mutation with profit tracking
  const adjustBalanceMutation = useMutation({
    mutationFn: async ({ userId, amount, type }) => {
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
    mutationFn: async ({ userId, tradeIds }) => {
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

  const pendingTrades = Array.isArray(trades) ? trades.filter(t => t.adminApproval === 'pending') : [];
  const approvedTrades = Array.isArray(trades) ? trades.filter(t => t.adminApproval === 'approved') : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-red-600" />
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <Button onClick={() => window.location.reload()} variant="outline">
              Refresh Data
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile-Friendly Navigation Menu */}
      <div className="bg-white border-b shadow-sm">
        <div className="w-full px-2 sm:px-4 lg:px-8">
          <div className="flex overflow-x-auto scrollbar-hide py-3 space-x-1 sm:space-x-2">
            {menuItems.map((item) => (
              <motion.button
                key={item.id}
                onClick={() => handleSectionChange(item.id)}
                className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 sm:py-3 rounded-lg whitespace-nowrap transition-all min-w-fit touch-manipulation ${
                  activeSection === item.id 
                    ? 'bg-blue-50 border-2 border-blue-200 text-blue-700 shadow-sm' 
                    : 'hover:bg-gray-50 text-gray-600 hover:text-gray-900 border-2 border-transparent'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: menuItems.indexOf(item) * 0.05 }}
              >
                <item.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${activeSection === item.id ? 'text-blue-600' : item.color}`} />
                <span className="font-medium text-xs sm:text-sm">{item.label}</span>
                {activeSection === item.id && (
                  <motion.div
                    className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-600 rounded-full"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full px-2 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4 sm:space-y-6 lg:space-y-8"
          >
            {activeSection === 'overview' && (
              <>
                {/* Mobile-Optimized Stats Overview */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
                    <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
                      <CardContent className="p-3 sm:p-4 lg:p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-blue-100 text-xs sm:text-sm font-medium">Total Users</p>
                            <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{stats?.totalUsers || 0}</p>
                          </div>
                          <Users className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-blue-200" />
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
                            <p className="text-lg sm:text-xl lg:text-2xl font-bold">${stats?.totalRevenue || '0'}</p>
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
                        <div className="text-right mt-2 sm:mt-0 sm:ml-4">
                          <p className="text-base sm:text-lg font-bold text-gray-900">
                            ${parseFloat(trade.totalAmount || '0').toFixed(2)}
                          </p>
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
                        </div>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedUser(user)}
                              className="hover:bg-blue-50 hover:border-blue-300 w-full sm:w-auto"
                            >
                              <Edit2 className="h-4 w-4 mr-1" />
                              Manage
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center">
                                <Users className="h-5 w-5 mr-2" />
                                Manage {user.username}
                              </DialogTitle>
                              <DialogDescription>
                                Complete user management dashboard with trade controls and profit tracking
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-6">
                              {/* User Overview */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                  <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                                    <Users className="h-4 w-4 mr-1" />
                                    Account Info
                                  </h4>
                                  <div className="space-y-1 text-sm">
                                    <p><span className="font-medium">Email:</span> {user.email}</p>
                                    <p><span className="font-medium">Status:</span> 
                                      <Badge variant={user.isActive ? "default" : "secondary"} className="ml-2">
                                        {user.isActive ? "Active" : "Inactive"}
                                      </Badge>
                                    </p>
                                    <p><span className="font-medium">Registered:</span> {new Date(user.createdAt).toLocaleDateString()}</p>
                                  </div>
                                </div>

                                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                  <h4 className="font-semibold text-green-800 mb-2 flex items-center">
                                    <BarChart3 className="h-4 w-4 mr-1" />
                                    Trading Stats
                                  </h4>
                                  <div className="space-y-1 text-sm">
                                    <p><span className="font-medium">Total Trades:</span> {userDetails?.trades?.length || 0}</p>
                                    <p><span className="font-medium">Pending:</span> {userDetails?.trades?.filter(t => t.adminApproval === 'pending').length || 0}</p>
                                    <p><span className="font-medium">Approved:</span> {userDetails?.trades?.filter(t => t.adminApproval === 'approved').length || 0}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Quick Actions */}
                              <div className="bg-gray-50 p-4 rounded-lg border">
                                <h4 className="font-semibold mb-3 flex items-center">
                                  <Settings className="h-4 w-4 mr-1" />
                                  Quick Actions
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex items-center justify-center p-2"
                                    onClick={() => setBalanceAction({ type: 'add', amount: '1000' })}
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    +$1K
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex items-center justify-center p-2"
                                    onClick={() => setBalanceAction({ type: 'add', amount: '5000' })}
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    +$5K
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex items-center justify-center p-2"
                                    onClick={() => setBalanceAction({ type: 'add', amount: '500' })}
                                  >
                                    <TrendingUp className="h-3 w-3 mr-1" />
                                    Profit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex items-center justify-center p-2"
                                    onClick={() => {
                                      if (userDetails?.trades?.filter(t => t.adminApproval === 'pending').length > 0) {
                                        approveTradesMutation.mutate({
                                          userId: user.id,
                                          tradeIds: userDetails.trades.filter(t => t.adminApproval === 'pending').map(t => t.id)
                                        });
                                      }
                                    }}
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Approve
                                  </Button>
                                </div>
                              </div>
                              
                              {/* Balance Management */}
                              <div className="space-y-4">
                                <h4 className="font-semibold flex items-center">
                                  <DollarSign className="h-4 w-4 mr-1" />
                                  Balance & Profit Management
                                </h4>
                                
                                <div className="grid grid-cols-3 gap-2">
                                  <Button
                                    size="sm"
                                    variant={balanceAction.type === 'add' ? 'default' : 'outline'}
                                    onClick={() => setBalanceAction(prev => ({ ...prev, type: 'add' }))}
                                    className="flex items-center justify-center"
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add Funds
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={balanceAction.type === 'profit' ? 'default' : 'outline'}
                                    onClick={() => setBalanceAction(prev => ({ ...prev, type: 'profit' }))}
                                    className="flex items-center justify-center bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
                                  >
                                    <TrendingUp className="h-3 w-3 mr-1" />
                                    Add Profit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={balanceAction.type === 'remove' ? 'default' : 'outline'}
                                    onClick={() => setBalanceAction(prev => ({ ...prev, type: 'remove' }))}
                                    className="flex items-center justify-center"
                                  >
                                    <Minus className="h-3 w-3 mr-1" />
                                    Remove
                                  </Button>
                                </div>
                                
                                <div className="flex space-x-2">
                                  <Input
                                    placeholder={balanceAction.type === 'profit' ? 'Enter profit amount' : 'Enter amount'}
                                    value={balanceAction.amount}
                                    onChange={(e) => setBalanceAction(prev => ({ ...prev, amount: e.target.value }))}
                                    className="flex-1"
                                  />
                                  <Button
                                    onClick={() => adjustBalanceMutation.mutate({
                                      userId: user.id,
                                      amount: parseFloat(balanceAction.amount),
                                      type: balanceAction.type
                                    })}
                                    disabled={!balanceAction.amount || adjustBalanceMutation.isPending}
                                    className={balanceAction.type === 'profit' ? 'bg-green-600 hover:bg-green-700' : ''}
                                  >
                                    {adjustBalanceMutation.isPending ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      balanceAction.type === 'profit' ? 'Add Profit' : 'Apply'
                                    )}
                                  </Button>
                                </div>
                              </div>

                              {/* Trade Management */}
                              {userDetails?.trades && userDetails.trades.length > 0 && (
                                <div className="space-y-4">
                                  <h4 className="font-semibold flex items-center">
                                    <TrendingUp className="h-4 w-4 mr-1" />
                                    Trade Management ({userDetails.trades.length} trades)
                                  </h4>
                                  
                                  <div className="max-h-64 overflow-y-auto space-y-2">
                                    {userDetails.trades.slice(0, 8).map((trade) => (
                                      <motion.div
                                        key={trade.id}
                                        whileHover={{ scale: 1.01 }}
                                        className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm"
                                      >
                                        <div className="flex-1">
                                          <div className="flex items-center space-x-2 mb-1">
                                            <span className="font-medium text-sm">{trade.symbol}</span>
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
                                          <p className="text-xs text-gray-600">
                                            {parseFloat(trade.quantity).toFixed(4)} @ ${parseFloat(trade.price || '0').toFixed(2)}
                                          </p>
                                          {trade.profitLoss && (
                                            <p className={`text-xs font-semibold ${parseFloat(trade.profitLoss) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                              P&L: ${parseFloat(trade.profitLoss).toFixed(2)}
                                            </p>
                                          )}
                                        </div>
                                        
                                        <div className="flex items-center space-x-2">
                                          <span className="text-sm font-bold">${parseFloat(trade.totalAmount || '0').toFixed(2)}</span>
                                          {trade.adminApproval === 'pending' && (
                                            <Button
                                              size="sm"
                                              onClick={() => approveTradesMutation.mutate({
                                                userId: user.id,
                                                tradeIds: [trade.id]
                                              })}
                                              disabled={approveTradesMutation.isPending}
                                              className="bg-green-600 hover:bg-green-700 text-white px-2 py-1"
                                            >
                                              <CheckCircle className="h-3 w-3" />
                                            </Button>
                                          )}
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
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === 'deposits' && (
              <Card className="shadow-lg">
                <CardHeader className="bg-gray-50 border-b">
                  <CardTitle className="flex items-center text-xl">
                    <DollarSign className="h-6 w-6 mr-2 text-yellow-600" />
                    Deposit Requests
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-center py-12">
                    <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No pending deposit requests</p>
                    <p className="text-sm text-gray-500 mt-2">User deposit requests will appear here for approval</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === 'crypto' && (
              <Card className="shadow-lg">
                <CardHeader className="bg-gray-50 border-b">
                  <CardTitle className="flex items-center text-xl">
                    <Wallet className="h-6 w-6 mr-2 text-green-600" />
                    Crypto Address Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-center py-12">
                    <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Crypto address management</p>
                    <p className="text-sm text-gray-500 mt-2">Manage cryptocurrency deposit addresses</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === 'settings' && (
              <Card className="shadow-lg">
                <CardHeader className="bg-gray-50 border-b">
                  <CardTitle className="flex items-center text-xl">
                    <Settings className="h-6 w-6 mr-2 text-purple-600" />
                    Website Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-center py-12">
                    <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Website configuration</p>
                    <p className="text-sm text-gray-500 mt-2">Configure global website settings</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === 'analytics' && (
              <Card className="shadow-lg">
                <CardHeader className="bg-gray-50 border-b">
                  <CardTitle className="flex items-center text-xl">
                    <BarChart3 className="h-6 w-6 mr-2 text-pink-600" />
                    Analytics Dashboard
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-center py-12">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Platform analytics</p>
                    <p className="text-sm text-gray-500 mt-2">View detailed platform metrics and insights</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === 'system' && (
              <Card className="shadow-lg">
                <CardHeader className="bg-gray-50 border-b">
                  <CardTitle className="flex items-center text-xl">
                    <Activity className="h-6 w-6 mr-2 text-indigo-600" />
                    System Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-center py-12">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">System health monitoring</p>
                    <p className="text-sm text-gray-500 mt-2">Monitor system performance and status</p>
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