import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, TrendingUp, CheckCircle, XCircle, Clock, DollarSign, Plus } from "lucide-react";

export default function AdminTrades() {
  const [trades, setTrades] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [profitAmount, setProfitAmount] = useState("");
  const [profitNote, setProfitNote] = useState("");
  const [showProfitDialog, setShowProfitDialog] = useState(false);

  useEffect(() => {
    loginAndFetchData();
  }, []);

  const loginAndFetchData = async () => {
    try {
      // Auto-login
      await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "ken.attwood@yahoo.com", password: "AdminPass2025!" }),
        credentials: "include"
      });

      // Fetch trades and stats
      const [tradesRes, statsRes] = await Promise.all([
        fetch("/api/admin/trades", { credentials: "include" }),
        fetch("/api/admin/stats", { credentials: "include" })
      ]);

      if (tradesRes.ok) {
        const tradesData = await tradesRes.json();
        setTrades(tradesData);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setLoading(false);
    }
  };

  const approveTrade = async (tradeId) => {
    try {
      const response = await fetch(`/api/admin/trades/${tradeId}/approve`, {
        method: "POST",
        credentials: "include"
      });
      
      if (response.ok) {
        // Refresh data
        loginAndFetchData();
      }
    } catch (error) {
      console.error("Failed to approve trade:", error);
    }
  };

  const rejectTrade = async (tradeId) => {
    try {
      const response = await fetch(`/api/admin/trades/${tradeId}/reject`, {
        method: "POST",
        credentials: "include"
      });
      
      if (response.ok) {
        // Refresh data
        loginAndFetchData();
      }
    } catch (error) {
      console.error("Failed to reject trade:", error);
    }
  };

  const addProfitToTrade = async () => {
    if (!selectedTrade || !profitAmount || isNaN(parseFloat(profitAmount))) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/trades/${selectedTrade.id}/profit`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          profitAmount: parseFloat(profitAmount),
          note: profitNote
        }),
        credentials: "include"
      });

      if (response.ok) {
        // Reset form and close dialog
        setProfitAmount("");
        setProfitNote("");
        setShowProfitDialog(false);
        setSelectedTrade(null);
        // Refresh data
        loginAndFetchData();
      }
    } catch (error) {
      console.error("Failed to add profit to trade:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const pendingTrades = trades.filter(t => t.adminApproval === 'pending');
  const approvedTrades = trades.filter(t => t.adminApproval === 'approved');
  const rejectedTrades = trades.filter(t => t.adminApproval === 'rejected');

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Trade Management Dashboard</h1>
          <Button onClick={loginAndFetchData}>Refresh Data</Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Trades</p>
                  <p className="text-2xl font-bold">{trades.length}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Approval</p>
                  <p className="text-2xl font-bold text-orange-600">{pendingTrades.length}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-green-600">{approvedTrades.length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">{rejectedTrades.length}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Trades - Priority Section */}
        {pendingTrades.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-orange-600">Pending Trades Requiring Approval ({pendingTrades.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingTrades.map((trade) => (
                  <div key={trade.id} className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                    <div>
                      <h3 className="font-semibold text-lg">{trade.symbol} - {trade.type.toUpperCase()}</h3>
                      <p className="text-sm text-gray-600">
                        Quantity: {parseFloat(trade.quantity).toFixed(4)} @ ${parseFloat(trade.price || '0').toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Total Value: ${parseFloat(trade.totalAmount || '0').toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">
                        User: {trade.userId} • {new Date(trade.createdAt).toLocaleDateString()} {new Date(trade.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        onClick={() => approveTrade(trade.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => rejectTrade(trade.id)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Trades History */}
        <Card>
          <CardHeader>
            <CardTitle>All Trades History ({trades.length} total)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {trades.map((trade) => (
                <div key={trade.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-semibold">{trade.symbol} - {trade.type.toUpperCase()}</h3>
                    <p className="text-sm text-gray-600">
                      Quantity: {parseFloat(trade.quantity).toFixed(4)} @ ${parseFloat(trade.price || '0').toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      User: {trade.userId} • {new Date(trade.createdAt).toLocaleDateString()}
                    </p>
                    {trade.profitLoss && (
                      <p className={`text-sm font-semibold ${parseFloat(trade.profitLoss) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        P&L: ${parseFloat(trade.profitLoss).toFixed(2)}
                      </p>
                    )}
                  </div>
                  <div className="text-right space-y-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant={
                        trade.adminApproval === 'pending' ? 'outline' :
                        trade.adminApproval === 'approved' ? 'default' : 'destructive'
                      }>
                        {trade.adminApproval}
                      </Badge>
                      {trade.adminApproval === 'approved' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedTrade(trade);
                            setShowProfitDialog(true);
                          }}
                          className="text-xs"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Profit
                        </Button>
                      )}
                    </div>
                    <p className="text-sm font-semibold">
                      ${parseFloat(trade.totalAmount || '0').toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Profit Addition Dialog */}
        <Dialog open={showProfitDialog} onOpenChange={setShowProfitDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Profit to Trade</DialogTitle>
              <DialogDescription>
                {selectedTrade && (
                  <>Add profit to {selectedTrade.symbol} trade (${parseFloat(selectedTrade.totalAmount || '0').toFixed(2)})</>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="profit-amount">Profit Amount ($)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="profit-amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={profitAmount}
                    onChange={(e) => setProfitAmount(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="profit-note">Note (Optional)</Label>
                <Input
                  id="profit-note"
                  placeholder="Admin profit adjustment"
                  value={profitNote}
                  onChange={(e) => setProfitNote(e.target.value)}
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={addProfitToTrade}
                  disabled={!profitAmount || isNaN(parseFloat(profitAmount))}
                  className="flex-1"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Profit
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowProfitDialog(false);
                    setProfitAmount("");
                    setProfitNote("");
                    setSelectedTrade(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}