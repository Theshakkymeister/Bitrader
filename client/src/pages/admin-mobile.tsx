import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
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
  Edit
} from "lucide-react";

export default function AdminMobile() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [balanceAction, setBalanceAction] = useState({ type: 'add', amount: '' });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Auto-login on mount
  useEffect(() => {
    handleLogin();
  }, []);

  const handleLogin = async () => {
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "ken.attwood@yahoo.com", password: "AdminPass2025!" }),
        credentials: "include"
      });

      if (response.ok) {
        setIsLoggedIn(true);
        // Trigger data refetch
        setTimeout(() => {
          statsRefetch();
          usersRefetch();
          tradesRefetch();
        }, 100);
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const { data: stats, refetch: statsRefetch } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: isLoggedIn,
  });

  const { data: users, refetch: usersRefetch } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: isLoggedIn,
  });

  const { data: trades, refetch: tradesRefetch } = useQuery({
    queryKey: ["/api/admin/trades"],
    enabled: isLoggedIn,
  });

  const { data: userDetails } = useQuery({
    queryKey: ["/api/admin/user", selectedUser?.id],
    enabled: !!selectedUser?.id && isLoggedIn,
  });

  // Approve trade mutation
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
      toast({ title: "Trades approved successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/user", selectedUser?.id] });
    },
    onError: () => {
      toast({ title: "Failed to approve trades", variant: "destructive" });
    }
  });

  // Balance adjustment mutation
  const adjustBalanceMutation = useMutation({
    mutationFn: async ({ userId, amount, type }: { userId: string; amount: number; type: 'add' | 'remove' }) => {
      const response = await fetch(`/api/admin/user/${userId}/balance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, type }),
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to adjust balance");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Balance adjusted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/user", selectedUser?.id] });
      setBalanceAction({ type: 'add', amount: '' });
    },
    onError: () => {
      toast({ title: "Failed to adjust balance", variant: "destructive" });
    }
  });

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-96">
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Authenticating admin access...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingTrades = Array.isArray(trades) ? trades.filter(t => t.adminApproval === 'pending') : [];
  const approvedTrades = Array.isArray(trades) ? trades.filter(t => t.adminApproval === 'approved') : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-red-600" />
            <h1 className="text-lg font-bold">Admin Dashboard</h1>
          </div>
          <Button onClick={() => window.location.reload()} size="sm">Refresh</Button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Stats Grid - Mobile Optimized */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div whileHover={{ scale: 1.02 }}>
            <Card className="border-0 shadow-md bg-gradient-to-r from-blue-50 to-blue-100">
              <CardContent className="p-4">
                <div className="text-center">
                  <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-xs text-blue-600 font-medium">Total Users</p>
                  <p className="text-xl font-bold text-blue-900">{stats?.totalUsers || 0}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }}>
            <Card className="border-0 shadow-md bg-gradient-to-r from-green-50 to-green-100">
              <CardContent className="p-4">
                <div className="text-center">
                  <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <p className="text-xs text-green-600 font-medium">Revenue</p>
                  <p className="text-lg font-bold text-green-900">${stats?.totalRevenue || '0'}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }}>
            <Card className="border-0 shadow-md bg-gradient-to-r from-orange-50 to-orange-100">
              <CardContent className="p-4">
                <div className="text-center">
                  <Clock className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                  <p className="text-xs text-orange-600 font-medium">Pending</p>
                  <p className="text-xl font-bold text-orange-900">{pendingTrades.length}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }}>
            <Card className="border-0 shadow-md bg-gradient-to-r from-purple-50 to-purple-100">
              <CardContent className="p-4">
                <div className="text-center">
                  <CheckCircle className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                  <p className="text-xs text-purple-600 font-medium">Approved</p>
                  <p className="text-xl font-bold text-purple-900">{approvedTrades.length}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* User Management - Mobile Optimized */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Users className="h-5 w-5 mr-2" />
              User Management ({Array.isArray(users) ? users.length : 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.isArray(users) && users.slice(0, 5).map((user) => (
                <motion.div
                  key={user.id}
                  whileHover={{ scale: 1.02 }}
                  className="p-3 bg-gray-50 rounded-lg border"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">{user.username}</h3>
                      <p className="text-xs text-gray-600 truncate">{user.email}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={user.isActive ? "default" : "secondary"} className="text-xs">
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSelectedUser(user)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-sm">
                          <DialogHeader>
                            <DialogTitle>Manage User: {user.username}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="text-sm">
                              <p><strong>Email:</strong> {user.email}</p>
                              <p><strong>Status:</strong> {user.isActive ? "Active" : "Inactive"}</p>
                              <p><strong>Registered:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
                            </div>
                            
                            {/* Balance Adjustment */}
                            <div className="space-y-3">
                              <h4 className="font-semibold">Adjust Balance</h4>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant={balanceAction.type === 'add' ? 'default' : 'outline'}
                                  onClick={() => setBalanceAction(prev => ({ ...prev, type: 'add' }))}
                                  className="flex-1"
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add
                                </Button>
                                <Button
                                  size="sm"
                                  variant={balanceAction.type === 'remove' ? 'default' : 'outline'}
                                  onClick={() => setBalanceAction(prev => ({ ...prev, type: 'remove' }))}
                                  className="flex-1"
                                >
                                  <Minus className="h-3 w-3 mr-1" />
                                  Remove
                                </Button>
                              </div>
                              <div className="flex space-x-2">
                                <Input
                                  placeholder="Amount"
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
                                  size="sm"
                                >
                                  {adjustBalanceMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Apply'}
                                </Button>
                              </div>
                            </div>

                            {/* Trade Approval */}
                            {userDetails?.trades?.filter(t => t.adminApproval === 'pending').length > 0 && (
                              <div className="space-y-3">
                                <h4 className="font-semibold">Pending Trades</h4>
                                <Button
                                  onClick={() => approveTradesMutation.mutate({
                                    userId: user.id,
                                    tradeIds: userDetails.trades.filter(t => t.adminApproval === 'pending').map(t => t.id)
                                  })}
                                  disabled={approveTradesMutation.isPending}
                                  className="w-full bg-green-600 hover:bg-green-700"
                                  size="sm"
                                >
                                  {approveTradesMutation.isPending ? (
                                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                  ) : (
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                  )}
                                  Approve All Pending ({userDetails.trades.filter(t => t.adminApproval === 'pending').length})
                                </Button>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Trade Management - Mobile Optimized */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Trade Management ({Array.isArray(trades) ? trades.length : 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.isArray(trades) && trades.slice(0, 10).map((trade) => (
                <motion.div
                  key={trade.id}
                  whileHover={{ scale: 1.02 }}
                  className="p-3 bg-gray-50 rounded-lg border"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-sm">{trade.symbol}</h3>
                        <Badge variant={trade.type === 'buy' ? 'default' : 'destructive'} className="text-xs">
                          {trade.type.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600">
                        Qty: {parseFloat(trade.quantity).toFixed(4)} @ ${parseFloat(trade.price || '0').toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">
                        User: {trade.userId.substring(0, 8)}... • {new Date(trade.createdAt).toLocaleDateString()}
                      </p>
                      {trade.profitLoss && (
                        <p className={`text-xs font-semibold ${parseFloat(trade.profitLoss) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          P&L: ${parseFloat(trade.profitLoss).toFixed(2)}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={
                          trade.adminApproval === 'pending' ? 'outline' :
                          trade.adminApproval === 'approved' ? 'default' : 'destructive'
                        }
                        className="text-xs mb-1"
                      >
                        {trade.adminApproval}
                      </Badge>
                      <p className="text-xs font-semibold">
                        ${parseFloat(trade.totalAmount || '0').toFixed(2)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}