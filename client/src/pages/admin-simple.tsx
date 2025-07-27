import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  Users, 
  DollarSign,
  TrendingUp,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
  EyeOff
} from "lucide-react";

export default function AdminSimple() {
  const [showValues, setShowValues] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Auto-login and data fetching
  const { data: stats, refetch: statsRefetch } = useQuery({
    queryKey: ["/api/admin/stats"],
    retry: false,
  });

  const { data: users, refetch: usersRefetch } = useQuery({
    queryKey: ["/api/admin/users"],
    retry: false,
  });

  const { data: trades, refetch: tradesRefetch } = useQuery({
    queryKey: ["/api/admin/trades"],
    retry: false,
  });

  const { data: deposits, refetch: depositsRefetch } = useQuery({
    queryKey: ["/api/admin/deposit-requests"],
    retry: false,
  });

  // Refresh all data
  const refreshData = () => {
    statsRefetch();
    usersRefetch();
    tradesRefetch();
    depositsRefetch();
    toast({ title: "Data refreshed successfully" });
  };

  // Simple approve trade mutation
  const approveTradeMutation = useMutation({
    mutationFn: async (tradeId: string) => {
      const response = await fetch(`/api/admin/trades/${tradeId}/approve`, {
        method: "POST",
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to approve trade");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Trade approved successfully" });
      tradesRefetch();
      statsRefetch();
    },
    onError: () => {
      toast({ title: "Failed to approve trade", variant: "destructive" });
    }
  });

  // Simple reject trade mutation
  const rejectTradeMutation = useMutation({
    mutationFn: async (tradeId: string) => {
      const response = await fetch(`/api/admin/trades/${tradeId}/reject`, {
        method: "POST",
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to reject trade");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Trade rejected successfully" });
      tradesRefetch();
      statsRefetch();
    },
    onError: () => {
      toast({ title: "Failed to reject trade", variant: "destructive" });
    }
  });

  const pendingTrades = Array.isArray(trades) ? trades.filter((t: any) => t.adminApproval === 'pending') : [];
  const recentTrades = Array.isArray(trades) ? trades.slice(0, 5) : [];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-red-600" />
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <Badge variant="destructive">Live Data</Badge>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowValues(!showValues)}
            >
              {showValues ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showValues ? "Hide Values" : "Show Values"}
            </Button>
            <Button onClick={refreshData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {showValues ? (stats as any)?.totalUsers || '0' : '•••'}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    {showValues ? `$${(stats as any)?.totalRevenue || '0'}` : '•••••'}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Trades</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {showValues ? pendingTrades.length : '•'}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Trades</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {showValues ? (stats as any)?.activeTrades || '0' : '•'}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Trades */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-orange-600" />
              Pending Trade Approvals ({pendingTrades.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingTrades.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No pending trades</p>
            ) : (
              <div className="space-y-4">
                {pendingTrades.map((trade: any) => (
                  <div key={trade.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="font-medium">{trade.symbol}</p>
                          <p className="text-sm text-gray-600">
                            {trade.type === 'buy' ? 'BUY' : 'SELL'} {trade.quantity} shares
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Price</p>
                          <p className="font-medium">
                            {showValues ? `$${trade.price}` : '••••'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total</p>
                          <p className="font-medium">
                            {showValues ? `$${(trade.quantity * trade.price).toFixed(2)}` : '••••••'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        onClick={() => approveTradeMutation.mutate(trade.id)}
                        disabled={approveTradeMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => rejectTradeMutation.mutate(trade.id)}
                        disabled={rejectTradeMutation.isPending}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-600" />
              Recent Users ({Array.isArray(users) ? users.length : 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!Array.isArray(users) || users.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No users found</p>
            ) : (
              <div className="space-y-4">
                {users.slice(0, 5).map((user: any) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{user.username}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Joined</p>
                      <p className="text-sm font-medium">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button onClick={() => window.location.href = '/admin/dashboard'} className="h-20">
                <div className="text-center">
                  <Shield className="h-6 w-6 mx-auto mb-2" />
                  <span>Full Admin Dashboard</span>
                </div>
              </Button>
              <Button onClick={() => window.location.href = '/'} variant="outline" className="h-20">
                <div className="text-center">
                  <TrendingUp className="h-6 w-6 mx-auto mb-2" />
                  <span>Trading Platform</span>
                </div>
              </Button>
              <Button onClick={refreshData} variant="outline" className="h-20">
                <div className="text-center">
                  <RefreshCw className="h-6 w-6 mx-auto mb-2" />
                  <span>Refresh All Data</span>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}