import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, AlertCircle, Search, Calendar, DollarSign, Hash, Activity, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Trade {
  id: string;
  symbol: string;
  assetType: string;
  type: "buy" | "sell";
  orderType: "market" | "limit" | "stop";
  quantity: string;
  price: string;
  currentPrice?: string;
  limitPrice?: string;
  stopPrice?: string;
  totalAmount: string;
  currentValue?: string;
  profitLoss?: string;
  profitLossPercentage?: string;
  status: string;
  adminApproval: string;
  isOpen?: boolean;
  createdAt: string;
  executedAt?: string;
  closedAt?: string;
  expiresAt?: string;
}

export default function OrdersPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: trades = [], isLoading: tradesLoading, error: tradesError } = useQuery<Trade[]>({
    queryKey: ['/api/trades'],
    enabled: !!user, // Only run query if user is authenticated
  });

  console.log("Orders page - trades loading:", tradesLoading, "error:", tradesError, "trades count:", trades.length);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Please log in to view your orders.</p>
      </div>
    );
  }

  if (tradesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (tradesError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-2">Failed to load orders</p>
          <p className="text-gray-600 text-sm">{tradesError.message}</p>
        </div>
      </div>
    );
  }

  const filteredTrades = trades.filter(trade =>
    trade.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trade.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trade.assetType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingTrades = filteredTrades.filter(t => t.adminApproval === 'pending');
  const approvedTrades = filteredTrades.filter(t => t.adminApproval === 'approved');
  const rejectedTrades = filteredTrades.filter(t => t.adminApproval === 'rejected');

  const handleTradeClick = (trade: Trade) => {
    setSelectedTrade(trade);
    setShowTradeModal(true);
  };

  const closeTradeModal = () => {
    setShowTradeModal(false);
    setSelectedTrade(null);
  };

  // Close trade mutation
  const closePositionMutation = useMutation({
    mutationFn: async (tradeId: string) => {
      const response = await apiRequest("PATCH", `/api/trades/${tradeId}/close`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trades'] });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio'] });
      toast({
        title: "Position Closed",
        description: "Your position has been successfully closed and profits/losses realized.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Close Position",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleCloseTrade = (tradeId: string) => {
    closePositionMutation.mutate(tradeId);
  };

  return (
    <motion.div 
      className="min-h-screen bg-gray-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order History</h1>
          <p className="text-gray-600">Detailed view of all your trading orders with comprehensive information</p>
        </motion.div>

        {/* Search Bar */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </motion.div>

        {/* Order Summary Cards */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-white border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{filteredTrades.length}</div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-yellow-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-yellow-600">Pending Approval</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{pendingTrades.length}</div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-600">Approved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{approvedTrades.length}</div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-red-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-600">Rejected</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{rejectedTrades.length}</div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Orders List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Order History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tradesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading orders...</span>
                </div>
              ) : filteredTrades.length === 0 ? (
                <motion.div 
                  className="text-center py-12"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                  <p className="text-gray-600">
                    {searchQuery ? 'No orders match your search criteria.' : 'You haven\'t placed any orders yet.'}
                  </p>
                </motion.div>
              ) : (
                <ScrollArea className="h-[600px]">
                  <motion.div className="space-y-4">
                    <AnimatePresence>
                      {filteredTrades.map((trade, index) => (
                        <motion.div
                          key={trade.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ 
                            duration: 0.3, 
                            delay: index * 0.05 
                          }}
                          className="border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer"
                          whileHover={{ scale: 1.005 }}
                          onClick={() => handleTradeClick(trade)}
                        >
                          {/* Header Section */}
                          <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-full ${
                                trade.type === 'buy' ? 'bg-green-100' : 'bg-red-100'
                              }`}>
                                {trade.type === 'buy' ? 
                                  <TrendingUp className="w-4 h-4 text-green-600" /> : 
                                  <TrendingDown className="w-4 h-4 text-red-600" />
                                }
                              </div>
                              
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className={`text-lg font-bold ${
                                    trade.type === 'buy' ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {trade.type.toUpperCase()}
                                  </span>
                                  <span className="text-xl font-bold text-gray-900">{trade.symbol}</span>
                                  <Badge variant="outline" className="text-xs capitalize">
                                    {trade.assetType}
                                  </Badge>
                                </div>
                                <div className="text-sm text-gray-500">
                                  Order #{trade.id.slice(0, 8)}...
                                </div>
                              </div>
                            </div>

                            {/* Status Badge */}
                            <div className="flex items-center gap-2">
                              {trade.adminApproval === 'approved' && <CheckCircle className="w-5 h-5 text-green-500" />}
                              {trade.adminApproval === 'pending' && <Clock className="w-5 h-5 text-yellow-500" />}
                              {trade.adminApproval === 'rejected' && <XCircle className="w-5 h-5 text-red-500" />}
                              
                              <Badge className={`${
                                trade.adminApproval === 'approved' ? 'bg-green-100 text-green-700 border-green-300' :
                                trade.adminApproval === 'pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                                trade.adminApproval === 'rejected' ? 'bg-red-100 text-red-700 border-red-300' : 'bg-gray-100 text-gray-700'
                              }`}>
                                {trade.adminApproval === 'approved' ? 'Approved' :
                                 trade.adminApproval === 'pending' ? 'Awaiting Approval' :
                                 trade.adminApproval === 'rejected' ? 'Rejected' : 'Unknown'}
                              </Badge>
                            </div>
                          </div>

                          {/* Details Section */}
                          <div className="p-4 space-y-3">
                            {/* Order Details Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <div className="text-xs text-gray-500 uppercase font-medium">Quantity</div>
                                <div className="text-sm font-semibold text-gray-900">
                                  {parseFloat(trade.quantity).toLocaleString()} {trade.assetType === 'crypto' ? trade.symbol : 'shares'}
                                </div>
                              </div>
                              
                              <div>
                                <div className="text-xs text-gray-500 uppercase font-medium">Entry Price</div>
                                <div className="text-sm font-semibold text-gray-900">
                                  ${parseFloat(trade.price) > 0 ? parseFloat(trade.price).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 6}) : '0.00'}
                                </div>
                              </div>
                              
                              {trade.currentPrice && trade.adminApproval === 'approved' && trade.isOpen && (
                                <div>
                                  <div className="text-xs text-gray-500 uppercase font-medium">Current Price</div>
                                  <div className="text-sm font-semibold text-gray-900">
                                    ${parseFloat(trade.currentPrice).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 6})}
                                  </div>
                                </div>
                              )}
                              
                              <div>
                                <div className="text-xs text-gray-500 uppercase font-medium">Total Value</div>
                                <div className="text-lg font-bold text-gray-900">
                                  ${parseFloat(trade.totalAmount) > 0 ? parseFloat(trade.totalAmount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'}
                                </div>
                              </div>
                            </div>

                            {/* Profit/Loss Section for open approved trades */}
                            {trade.adminApproval === 'approved' && trade.isOpen && trade.profitLoss && (
                              <div className="mt-4 p-3 rounded-lg bg-gray-50 border">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-4">
                                    <div>
                                      <div className="text-xs text-gray-500 uppercase font-medium">Unrealized P&L</div>
                                      <div className={`text-lg font-bold ${
                                        parseFloat(trade.profitLoss) >= 0 ? 'text-green-600' : 'text-red-600'
                                      }`}>
                                        {parseFloat(trade.profitLoss) >= 0 ? '+' : ''}${parseFloat(trade.profitLoss).toFixed(2)}
                                      </div>
                                    </div>
                                    
                                    {trade.profitLossPercentage && (
                                      <div>
                                        <div className="text-xs text-gray-500 uppercase font-medium">Return</div>
                                        <div className={`text-lg font-bold ${
                                          parseFloat(trade.profitLossPercentage) >= 0 ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                          {parseFloat(trade.profitLossPercentage) >= 0 ? '+' : ''}{parseFloat(trade.profitLossPercentage).toFixed(2)}%
                                        </div>
                                      </div>
                                    )}
                                    
                                    {trade.currentValue && (
                                      <div>
                                        <div className="text-xs text-gray-500 uppercase font-medium">Current Value</div>
                                        <div className="text-lg font-bold text-gray-900">
                                          ${parseFloat(trade.currentValue).toFixed(2)}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <Button 
                                    size="sm" 
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCloseTrade(trade.id);
                                    }}
                                  >
                                    Close Position
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Closed trade P&L display */}
                            {!trade.isOpen && trade.profitLoss && (
                              <div className="mt-4 p-3 rounded-lg bg-gray-100 border">
                                <div className="flex items-center space-x-4">
                                  <div>
                                    <div className="text-xs text-gray-500 uppercase font-medium">Realized P&L</div>
                                    <div className={`text-lg font-bold ${
                                      parseFloat(trade.profitLoss) >= 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                      {parseFloat(trade.profitLoss) >= 0 ? '+' : ''}${parseFloat(trade.profitLoss).toFixed(2)}
                                    </div>
                                  </div>
                                  
                                  {trade.profitLossPercentage && (
                                    <div>
                                      <div className="text-xs text-gray-500 uppercase font-medium">Return</div>
                                      <div className={`text-lg font-bold ${
                                        parseFloat(trade.profitLossPercentage) >= 0 ? 'text-green-600' : 'text-red-600'
                                      }`}>
                                        {parseFloat(trade.profitLossPercentage) >= 0 ? '+' : ''}{parseFloat(trade.profitLossPercentage).toFixed(2)}%
                                      </div>
                                    </div>
                                  )}
                                  
                                  <div>
                                    <div className="text-xs text-gray-500 uppercase font-medium">Closed</div>
                                    <div className="text-sm text-gray-600">
                                      {trade.closedAt ? new Date(trade.closedAt).toLocaleDateString() : 'N/A'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Timestamp and Additional Info */}
                            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <span>
                                  <strong>Placed:</strong> {new Date(trade.createdAt).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })} at {new Date(trade.createdAt).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                                {trade.expiresAt && (
                                  <span>
                                    <strong>Expires:</strong> {new Date(trade.expiresAt).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <div className="text-xs text-gray-500">
                                  Status: <span className="font-medium capitalize">{trade.status}</span>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-6 px-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTradeClick(trade);
                                  }}
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  Details
                                </Button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Detailed Trade Modal */}
      <Dialog open={showTradeModal} onOpenChange={closeTradeModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${
                selectedTrade?.type === 'buy' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {selectedTrade?.type === 'buy' ? 
                  <TrendingUp className="w-5 h-5 text-green-600" /> : 
                  <TrendingDown className="w-5 h-5 text-red-600" />
                }
              </div>
              <div>
                <span className={`text-lg font-bold ${
                  selectedTrade?.type === 'buy' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {selectedTrade?.type.toUpperCase()}
                </span>
                <span className="text-xl font-bold text-gray-900 ml-2">{selectedTrade?.symbol}</span>
              </div>
            </DialogTitle>
            <DialogDescription>
              Order #{selectedTrade?.id} • {selectedTrade?.assetType?.charAt(0).toUpperCase()}{selectedTrade?.assetType?.slice(1)} Trade
            </DialogDescription>
          </DialogHeader>

          {selectedTrade && (
            <div className="space-y-6">
              {/* Status Section */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-medium text-gray-700">Current Status</h3>
                    {selectedTrade.adminApproval === 'approved' && <CheckCircle className="w-4 h-4 text-green-500" />}
                    {selectedTrade.adminApproval === 'pending' && <Clock className="w-4 h-4 text-yellow-500" />}
                    {selectedTrade.adminApproval === 'rejected' && <XCircle className="w-4 h-4 text-red-500" />}
                  </div>
                  <Badge className={`${
                    selectedTrade.adminApproval === 'approved' ? 'bg-green-100 text-green-700 border-green-300' :
                    selectedTrade.adminApproval === 'pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                    selectedTrade.adminApproval === 'rejected' ? 'bg-red-100 text-red-700 border-red-300' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {selectedTrade.adminApproval === 'approved' ? 'Approved' :
                     selectedTrade.adminApproval === 'pending' ? 'Awaiting Admin Approval' :
                     selectedTrade.adminApproval === 'rejected' ? 'Rejected by Admin' : 'Unknown'}
                  </Badge>
                </div>
              </div>

              {/* Order Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    Order Information
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Asset Symbol</span>
                      <span className="text-sm font-medium text-gray-900">{selectedTrade.symbol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Asset Type</span>
                      <span className="text-sm font-medium text-gray-900 capitalize">{selectedTrade.assetType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Order Type</span>
                      <span className="text-sm font-medium text-gray-900 capitalize">{selectedTrade.orderType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Transaction Type</span>
                      <span className={`text-sm font-medium ${
                        selectedTrade.type === 'buy' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {selectedTrade.type.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <DollarSign className="w-5 h-5 mr-2" />
                    Financial Details
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Quantity</span>
                      <span className="text-sm font-medium text-gray-900">
                        {parseFloat(selectedTrade.quantity).toLocaleString()} {selectedTrade.assetType === 'crypto' ? selectedTrade.symbol : 'shares'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Price per Unit</span>
                      <span className="text-sm font-medium text-gray-900">
                        ${parseFloat(selectedTrade.price) > 0 ? parseFloat(selectedTrade.price).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 6}) : '0.00'}
                      </span>
                    </div>
                    {selectedTrade.limitPrice && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Limit Price</span>
                        <span className="text-sm font-medium text-gray-900">
                          ${parseFloat(selectedTrade.limitPrice).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 6})}
                        </span>
                      </div>
                    )}
                    {selectedTrade.stopPrice && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Stop Price</span>
                        <span className="text-sm font-medium text-gray-900">
                          ${parseFloat(selectedTrade.stopPrice).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 6})}
                        </span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-base font-medium text-gray-900">Total Value</span>
                      <span className="text-base font-bold text-gray-900">
                        ${parseFloat(selectedTrade.totalAmount) > 0 ? parseFloat(selectedTrade.totalAmount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Timeline & Status
                </h3>
                
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Order Placed</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(selectedTrade.createdAt).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })} at {new Date(selectedTrade.createdAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </span>
                  </div>
                  
                  {selectedTrade.expiresAt && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Expires</span>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(selectedTrade.expiresAt).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })} at {new Date(selectedTrade.expiresAt).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Order Status</span>
                    <span className="text-sm font-medium text-gray-900 capitalize">{selectedTrade.status}</span>
                  </div>
                </div>
              </div>

              {/* Order ID Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Hash className="w-5 h-5 mr-2" />
                  Reference Information
                </h3>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Order ID</span>
                    <div className="flex items-center space-x-2">
                      <code className="text-xs bg-white px-2 py-1 rounded border font-mono text-gray-700">
                        {selectedTrade.id}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedTrade.id);
                        }}
                        className="h-6"
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={closeTradeModal}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}