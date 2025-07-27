import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, AlertCircle, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface Trade {
  id: string;
  symbol: string;
  assetType: string;
  type: "buy" | "sell";
  orderType: "market" | "limit" | "stop";
  quantity: string;
  price: string;
  limitPrice?: string;
  stopPrice?: string;
  totalAmount: string;
  status: string;
  adminApproval: string;
  createdAt: string;
  expiresAt?: string;
}

export default function OrdersPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: trades = [], isLoading: tradesLoading } = useQuery<Trade[]>({
    queryKey: ['/api/trades'],
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Please log in to view your orders.</p>
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
                          className="border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 overflow-hidden"
                          whileHover={{ scale: 1.005 }}
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
                                <div className="text-xs text-gray-500 uppercase font-medium">Price</div>
                                <div className="text-sm font-semibold text-gray-900">
                                  ${parseFloat(trade.price) > 0 ? parseFloat(trade.price).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 6}) : '0.00'}
                                </div>
                              </div>
                              
                              <div>
                                <div className="text-xs text-gray-500 uppercase font-medium">Order Type</div>
                                <div className="text-sm font-semibold text-gray-900 capitalize">
                                  {trade.orderType}
                                  {trade.limitPrice && ` @ $${parseFloat(trade.limitPrice).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 6})}`}
                                  {trade.stopPrice && ` Stop $${parseFloat(trade.stopPrice).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 6})}`}
                                </div>
                              </div>
                              
                              <div>
                                <div className="text-xs text-gray-500 uppercase font-medium">Total Value</div>
                                <div className="text-lg font-bold text-gray-900">
                                  ${parseFloat(trade.totalAmount) > 0 ? parseFloat(trade.totalAmount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'}
                                </div>
                              </div>
                            </div>

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
                              
                              <div className="text-xs text-gray-500">
                                Status: <span className="font-medium capitalize">{trade.status}</span>
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
    </motion.div>
  );
}