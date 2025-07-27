import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { TrendingUp, TrendingDown, DollarSign, Clock, CheckCircle, XCircle, AlertCircle, Search } from "lucide-react";

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

interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  marketCap?: number;
}

// Market data with $0.00 values for new users
const mockMarketData: MarketData[] = [
  { symbol: "AAPL", name: "Apple Inc.", price: 0.00, change: 0.00, changePercent: 0.00, volume: 0 },
  { symbol: "TSLA", name: "Tesla Inc.", price: 0.00, change: 0.00, changePercent: 0.00, volume: 0 },
  { symbol: "GOOGL", name: "Alphabet Inc.", price: 0.00, change: 0.00, changePercent: 0.00, volume: 0 },
  { symbol: "MSFT", name: "Microsoft Corp.", price: 0.00, change: 0.00, changePercent: 0.00, volume: 0 },
  { symbol: "SPY", name: "SPDR S&P 500 ETF", price: 0.00, change: 0.00, changePercent: 0.00, volume: 0 },
  { symbol: "QQQ", name: "Invesco QQQ Trust", price: 0.00, change: 0.00, changePercent: 0.00, volume: 0 },
  { symbol: "BTC", name: "Bitcoin", price: 0.00, change: 0.00, changePercent: 0.00, volume: 0 },
  { symbol: "ETH", name: "Ethereum", price: 0.00, change: 0.00, changePercent: 0.00, volume: 0 },
  { symbol: "SOL", name: "Solana", price: 0.00, change: 0.00, changePercent: 0.00, volume: 0 },
  { symbol: "USDT", name: "Tether", price: 0.00, change: 0.00, changePercent: 0.00, volume: 0 },
  { symbol: "USDC", name: "USD Coin", price: 0.00, change: 0.00, changePercent: 0.00, volume: 0 },
];

function MarketDataCard({ data }: { data: MarketData }) {
  const isPositive = data.change >= 0;
  
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-semibold text-lg">{data.symbol}</h3>
            <p className="text-sm text-muted-foreground truncate">{data.name}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg">${data.price.toFixed(2)}</p>
            <div className={`flex items-center text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
              {isPositive ? '+' : ''}{data.change.toFixed(2)} ({isPositive ? '+' : ''}{data.changePercent.toFixed(2)}%)
            </div>
          </div>
        </div>
        {data.volume !== undefined && (
          <p className="text-xs text-muted-foreground">Vol: {(data.volume / 1000000).toFixed(1)}M</p>
        )}
      </CardContent>
    </Card>
  );
}

function TradeCard({ trade }: { trade: Trade }) {
  const getStatusIcon = () => {
    switch (trade.adminApproval) {
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusColor = () => {
    switch (trade.adminApproval) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold">{trade.symbol}</span>
              <Badge variant="outline">{trade.assetType}</Badge>
              <Badge variant={trade.type === "buy" ? "default" : "destructive"}>
                {trade.type.toUpperCase()}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{trade.orderType} order</p>
          </div>
          <div className="text-right">
            <p className="font-bold">${trade.totalAmount}</p>
            <div className="flex items-center gap-1">
              {getStatusIcon()}
              <Badge className={getStatusColor()}>
                {trade.adminApproval}
              </Badge>
            </div>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          <p>Quantity: {trade.quantity} @ ${trade.price}</p>
          <p>Created: {new Date(trade.createdAt).toLocaleDateString()}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TradingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get URL parameter to determine which tab to show
  const urlParams = new URLSearchParams(window.location.search);
  const activeTab = urlParams.get('tab') || 'markets';
  
  const [symbol, setSymbol] = useState("");
  const [assetType, setAssetType] = useState("stock");
  const [orderType, setOrderType] = useState<"market" | "limit" | "stop">("market");
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [quantity, setQuantity] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [stopPrice, setStopPrice] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: trades = [], isLoading: tradesLoading } = useQuery<Trade[]>({
    queryKey: ['/api/trades'],
  });

  // Debug logging
  console.log('Trades data:', trades);
  console.log('Trades loading:', tradesLoading);
  console.log('Trades length:', trades?.length);

  const tradeMutation = useMutation({
    mutationFn: async (tradeData: any) => {
      const response = await apiRequest('POST', '/api/trades', tradeData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Trade Order Submitted",
        description: "Your trade order has been submitted and is pending admin approval.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/trades'] });
      // Reset form
      setSymbol("");
      setQuantity("");
      setLimitPrice("");
      setStopPrice("");
    },
    onError: (error: any) => {
      toast({
        title: "Trade Failed",
        description: error.message || "Failed to submit trade order",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!symbol || !quantity) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // For new users, use $0.00 as price
    const currentPrice = 0.00;
    const tradePrice = orderType === "limit" && limitPrice ? parseFloat(limitPrice) : currentPrice;
    const totalAmount = (parseFloat(quantity) * tradePrice).toFixed(2);

    const tradeData = {
      symbol: symbol.toUpperCase(),
      assetType,
      type: tradeType,
      orderType,
      quantity,
      price: currentPrice.toFixed(2),
      limitPrice: orderType === "limit" ? limitPrice : undefined,
      stopPrice: orderType === "stop" ? stopPrice : undefined,
      totalAmount,
      status: "pending",
      adminApproval: "pending"
    };

    tradeMutation.mutate(tradeData);
  };

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Please log in to access trading.</div>;
  }

  // Markets Page
  if (activeTab === 'markets') {
    // Filter market data based on search query
    const filteredMarketData = mockMarketData.filter((data) => 
      data.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      data.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Markets</h1>
            <p className="text-gray-600">Live market data and prices</p>
          </div>
          
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search assets (AAPL, Bitcoin, etc.)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full"
              />
            </div>
            {searchQuery && (
              <p className="text-sm text-gray-500 mt-2">
                Found {filteredMarketData.length} asset{filteredMarketData.length !== 1 ? 's' : ''} matching "{searchQuery}"
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredMarketData.length > 0 ? (
              filteredMarketData.map((data) => (
                <MarketDataCard key={data.symbol} data={data} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Search className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No assets found</h3>
                  <p className="text-gray-500">
                    No assets match your search for "{searchQuery}". Try a different search term.
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setSearchQuery("")}
                  className="mt-4"
                >
                  Clear Search
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // My Orders Page - Comprehensive Robinhood-style orders interface
  if (activeTab === 'orders') {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">My Orders</h1>
            <p className="text-gray-600">Track all your trading orders and their status</p>
          </div>

          {/* Order Summary Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{trades.filter(t => t.adminApproval === 'approved').length}</div>
                  <div className="text-sm text-gray-500">Approved</div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{trades.filter(t => t.adminApproval === 'pending').length}</div>
                  <div className="text-sm text-gray-500">Pending</div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{trades.filter(t => t.adminApproval === 'rejected').length}</div>
                  <div className="text-sm text-gray-500">Rejected</div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{trades.length}</div>
                  <div className="text-sm text-gray-500">Total Orders</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Orders List */}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Order History
              </CardTitle>
              <CardDescription className="text-gray-600">
                Real-time order tracking with admin approval status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tradesLoading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Loading your orders...</p>
                </div>
              ) : !trades || trades.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Orders Yet</h3>
                  <p className="text-gray-600 mb-4">Start trading to see your orders here</p>
                  <Button 
                    onClick={() => setActiveTab('trade')}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Place Your First Order
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {trades.map((trade) => (
                    <div key={trade.id} className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                      <div className="flex items-center justify-between">
                        {/* Left Side - Order Info */}
                        <div className="flex items-center gap-4">
                          <div className={`w-3 h-3 rounded-full ${
                            trade.adminApproval === 'approved' ? 'bg-green-500' :
                            trade.adminApproval === 'pending' ? 'bg-yellow-500' :
                            trade.adminApproval === 'rejected' ? 'bg-red-500' : 'bg-gray-400'
                          }`} />
                          
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold text-lg ${
                                trade.type === 'buy' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {trade.type.toUpperCase()}
                              </span>
                              <span className="text-gray-900 font-bold">{trade.symbol}</span>
                              <Badge variant="outline" className="text-xs">
                                {trade.assetType}
                              </Badge>
                            </div>
                            
                            <div className="text-sm text-gray-600 mt-1">
                              {trade.quantity} shares • {trade.orderType} order
                            </div>
                            
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(trade.createdAt).toLocaleDateString()} at {new Date(trade.createdAt).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>

                        {/* Right Side - Status & Amount */}
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-2">
                            {trade.adminApproval === 'approved' && <CheckCircle className="w-4 h-4 text-green-500" />}
                            {trade.adminApproval === 'pending' && <Clock className="w-4 h-4 text-yellow-500" />}
                            {trade.adminApproval === 'rejected' && <XCircle className="w-4 h-4 text-red-500" />}
                            
                            <span className={`font-medium text-sm ${
                              trade.adminApproval === 'approved' ? 'text-green-600' :
                              trade.adminApproval === 'pending' ? 'text-yellow-600' :
                              trade.adminApproval === 'rejected' ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              {trade.adminApproval === 'approved' ? 'Approved' :
                               trade.adminApproval === 'pending' ? 'Awaiting Approval' :
                               trade.adminApproval === 'rejected' ? 'Rejected' : 'Unknown'}
                            </span>
                          </div>
                          
                          <div className="text-gray-900 font-semibold">
                            ${parseFloat(trade.totalAmount).toFixed(2)}
                          </div>
                          
                          <div className="text-sm text-gray-600">
                            @ ${parseFloat(trade.price).toFixed(2)}
                          </div>
                        </div>
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

  // Trade Page (default) - Robinhood-style comprehensive trading interface
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Live Trading</h1>
          <p className="text-gray-600">Professional trading platform with real-time market data</p>
          
          {/* Buying Power */}
          <div className="mt-4 p-4 rounded-lg bg-white border border-green-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Buying Power</span>
              <span className="text-2xl font-bold text-green-600">$10,250.00</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trading Form - Left Side */}
          <div className="lg:col-span-2">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Place Order
                </CardTitle>
                <CardDescription className="text-gray-600">
                  All orders require admin approval • Live market pricing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Asset Selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-700">Symbol</Label>
                      <Input
                        value={symbol}
                        onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                        placeholder="AAPL, TSLA, SPY..."
                        className="border-gray-300"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-gray-700">Asset Type</Label>
                      <Select value={assetType} onValueChange={setAssetType}>
                        <SelectTrigger className="border-gray-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="stock">📈 Stock</SelectItem>
                          <SelectItem value="crypto">₿ Cryptocurrency</SelectItem>
                          <SelectItem value="etf">📊 ETF</SelectItem>
                          <SelectItem value="option">⚡ Options</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Buy/Sell Toggle - Robinhood Style */}
                  <div className="flex rounded-lg overflow-hidden border border-gray-300">
                    <Button
                      type="button"
                      onClick={() => setTradeType("buy")}
                      className={`flex-1 rounded-none ${
                        tradeType === "buy"
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                      }`}
                    >
                      Buy
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setTradeType("sell")}
                      className={`flex-1 rounded-none ${
                        tradeType === "sell"
                          ? "bg-red-600 hover:bg-red-700 text-white"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                      }`}
                    >
                      Sell
                    </Button>
                  </div>

                  {/* Order Type */}
                  <div>
                    <Label className="text-gray-700">Order Type</Label>
                    <Select value={orderType} onValueChange={(value: "market" | "limit" | "stop") => setOrderType(value)}>
                      <SelectTrigger className="border-gray-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="market">Market Order</SelectItem>
                        <SelectItem value="limit">Limit Order</SelectItem>
                        <SelectItem value="stop">Stop Loss</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Quantity */}
                  <div>
                    <Label className="text-gray-700">Quantity</Label>
                    <Input
                      type="number"
                      step="any"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="Number of shares"
                      className="border-gray-300"
                      required
                    />
                  </div>

                  {/* Conditional Price Fields */}
                  {orderType === "limit" && (
                    <div>
                      <Label className="text-gray-700">Limit Price</Label>
                      <Input
                        type="number"
                        step="any"
                        value={limitPrice}
                        onChange={(e) => setLimitPrice(e.target.value)}
                        placeholder="Price per share"
                        className="border-gray-300"
                        required
                      />
                    </div>
                  )}

                  {orderType === "stop" && (
                    <div>
                      <Label className="text-gray-700">Stop Price</Label>
                      <Input
                        type="number"
                        step="any"
                        value={stopPrice}
                        onChange={(e) => setStopPrice(e.target.value)}
                        placeholder="Stop loss price"
                        className="border-gray-300"
                        required
                      />
                    </div>
                  )}

                  {/* Order Summary */}
                  <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                    <h3 className="text-gray-900 font-semibold mb-3">Order Summary</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Action:</span>
                        <span className={`font-medium ${tradeType === 'buy' ? 'text-green-600' : 'text-red-600'}`}>
                          {tradeType.toUpperCase()} {symbol || 'SYMBOL'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Quantity:</span>
                        <span className="text-gray-900">{quantity || '0'} shares</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Order Type:</span>
                        <span className="text-gray-900">{orderType}</span>
                      </div>
                      {orderType === "limit" && limitPrice && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Limit Price:</span>
                          <span className="text-gray-900">${limitPrice}</span>
                        </div>
                      )}
                      <div className="border-t border-gray-300 pt-2 mt-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Estimated Total:</span>
                          <span className="text-gray-900 font-semibold">
                            ${quantity && limitPrice ? (parseFloat(quantity) * parseFloat(limitPrice)).toFixed(2) : '0.00'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={tradeMutation.isPending}
                    className={`w-full h-12 font-semibold text-lg ${
                      tradeType === "buy"
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-red-600 hover:bg-red-700"
                    }`}
                  >
                    {tradeMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </div>
                    ) : (
                      <>
                        {tradeType === "buy" ? "Place Buy Order" : "Place Sell Order"}
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    All orders require admin approval before execution
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Market Information & Quick Stats - Right Side */}
          <div className="space-y-4">
            {/* Popular Stocks */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900 text-sm">Popular Today</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { symbol: "AAPL", price: "$150.25", change: "+2.4%" },
                  { symbol: "TSLA", price: "$245.80", change: "-1.2%" },
                  { symbol: "GOOGL", price: "$138.92", change: "+0.8%" },
                  { symbol: "MSFT", price: "$378.45", change: "+1.5%" },
                  { symbol: "NVDA", price: "$875.30", change: "+3.2%" }
                ].map((stock) => (
                  <div key={stock.symbol} className="flex items-center justify-between">
                    <div>
                      <div className="text-gray-900 font-medium">{stock.symbol}</div>
                      <div className="text-gray-600 text-sm">{stock.price}</div>
                    </div>
                    <div className={`text-sm font-medium ${
                      stock.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stock.change}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Crypto Markets */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900 text-sm">Crypto Markets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { symbol: "BTC", price: "$45,230", change: "+1.8%" },
                  { symbol: "ETH", price: "$2,845", change: "+2.1%" },
                  { symbol: "SOL", price: "$98.45", change: "-0.5%" },
                  { symbol: "USDT", price: "$1.00", change: "+0.0%" }
                ].map((crypto) => (
                  <div key={crypto.symbol} className="flex items-center justify-between">
                    <div>
                      <div className="text-gray-900 font-medium">{crypto.symbol}</div>
                      <div className="text-gray-600 text-sm">{crypto.price}</div>
                    </div>
                    <div className={`text-sm font-medium ${
                      crypto.change.startsWith('+') && !crypto.change.includes('0.0') ? 'text-green-600' : 
                      crypto.change.startsWith('-') ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {crypto.change}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* ETF Options */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900 text-sm">Popular ETFs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { symbol: "SPY", price: "$418.75", change: "+0.9%" },
                  { symbol: "QQQ", price: "$385.20", change: "+1.2%" },
                  { symbol: "VTI", price: "$234.50", change: "+0.7%" }
                ].map((etf) => (
                  <div key={etf.symbol} className="flex items-center justify-between">
                    <div>
                      <div className="text-gray-900 font-medium">{etf.symbol}</div>
                      <div className="text-gray-600 text-sm">{etf.price}</div>
                    </div>
                    <div className="text-green-600 text-sm font-medium">
                      {etf.change}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}