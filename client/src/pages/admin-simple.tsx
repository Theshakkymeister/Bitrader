import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, Users, DollarSign } from "lucide-react";

export default function AdminSimple() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [credentials, setCredentials] = useState({ email: "ken.attwood@yahoo.com", password: "AdminPass2025!" });

  const handleLogin = async () => {
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        credentials: "include"
      });

      if (response.ok) {
        setIsLoggedIn(true);
        statsRefetch();
        usersRefetch();
        tradesRefetch();
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

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={credentials.email}
              onChange={(e) => setCredentials(prev => ({...prev, email: e.target.value}))}
            />
            <Input
              type="password"
              placeholder="Password"
              value={credentials.password}
              onChange={(e) => setCredentials(prev => ({...prev, password: e.target.value}))}
            />
            <Button onClick={handleLogin} className="w-full">Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Button onClick={() => setIsLoggedIn(false)}>Logout</Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold">${stats?.totalRevenue || '0'}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Trades</p>
                  <p className="text-2xl font-bold">{stats?.activeTrades || 0}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Today's Users</p>
                  <p className="text-2xl font-bold">{stats?.usersRegisteredToday || 0}</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Management */}
        <Card>
          <CardHeader>
            <CardTitle>User Management ({Array.isArray(users) ? users.length : 0} users)</CardTitle>
          </CardHeader>
          <CardContent>
            {!users ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {Array.isArray(users) && users.slice(0, 5).map((user: any) => (
                  <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-semibold">{user.username}</h3>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-xs text-gray-500">Registered: {new Date(user.createdAt).toLocaleDateString()}</p>
                    </div>
                    <Badge variant={user.isActive ? "default" : "secondary"}>
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trade Management */}
        <Card>
          <CardHeader>
            <CardTitle>Trade Management ({Array.isArray(trades) ? trades.length : 0} trades)</CardTitle>
          </CardHeader>
          <CardContent>
            {!trades ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {Array.isArray(trades) && trades.slice(0, 10).map((trade: any) => (
                  <div key={trade.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-semibold">{trade.symbol} - {trade.type.toUpperCase()}</h3>
                      <p className="text-sm text-gray-600">
                        Quantity: {trade.quantity} @ ${parseFloat(trade.price || '0').toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">
                        User: {trade.userId} • {new Date(trade.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={
                        trade.adminApproval === 'pending' ? 'outline' :
                        trade.adminApproval === 'approved' ? 'default' : 'destructive'
                      }>
                        {trade.adminApproval}
                      </Badge>
                      <p className="text-sm font-semibold mt-1">
                        ${parseFloat(trade.totalAmount || '0').toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}