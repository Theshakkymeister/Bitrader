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

  // My Orders Page
  if (activeTab === 'orders') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
            <p className="text-gray-600">View and manage your trading orders</p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
              <CardDescription>All your recent trading orders and their status</CardDescription>
            </CardHeader>
            <CardContent>
              {tradesLoading ? (
                <div className="text-center py-8">Loading orders...</div>
              ) : trades.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No orders found. Start trading to see your orders here.
                </div>
              ) : (
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {trades.map((trade) => (
                      <TradeCard key={trade.id} trade={trade} />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Trade Page (default)
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Trade</h1>
          <p className="text-gray-600">Place your trading orders</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Place Trade Order
            </CardTitle>
            <CardDescription>
              Submit your trade for admin approval. All trades require approval before execution.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="symbol">Symbol</Label>
                  <Input
                    id="symbol"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    placeholder="AAPL, BTC, SPY..."
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="assetType">Asset Type</Label>
                  <Select value={assetType} onValueChange={setAssetType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stock">Stock</SelectItem>
                      <SelectItem value="crypto">Cryptocurrency</SelectItem>
                      <SelectItem value="etf">ETF</SelectItem>
                      <SelectItem value="option">Option</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tradeType">Order Side</Label>
                  <Select value={tradeType} onValueChange={(value: "buy" | "sell") => setTradeType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buy">Buy</SelectItem>
                      <SelectItem value="sell">Sell</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="orderType">Order Type</Label>
                  <Select value={orderType} onValueChange={(value: "market" | "limit" | "stop") => setOrderType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="market">Market</SelectItem>
                      <SelectItem value="limit">Limit</SelectItem>
                      <SelectItem value="stop">Stop</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="any"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Number of shares/units"
                  required
                />
              </div>

              {orderType === "limit" && (
                <div>
                  <Label htmlFor="limitPrice">Limit Price</Label>
                  <Input
                    id="limitPrice"
                    type="number"
                    step="any"
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(e.target.value)}
                    placeholder="Enter limit price"
                    required
                  />
                </div>
              )}

              {orderType === "stop" && (
                <div>
                  <Label htmlFor="stopPrice">Stop Price</Label>
                  <Input
                    id="stopPrice"
                    type="number"
                    step="any"
                    value={stopPrice}
                    onChange={(e) => setStopPrice(e.target.value)}
                    placeholder="Enter stop price"
                    required
                  />
                </div>
              )}

              <div className="bg-muted p-3 rounded-lg">
                <div className="flex justify-between items-center text-sm">
                  <span>Current Price:</span>
                  <span className="font-semibold">$0.00</span>
                </div>
                {quantity && (
                  <div className="flex justify-between items-center text-sm">
                    <span>Estimated Total:</span>
                    <span className="font-semibold">$0.00</span>
                  </div>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={tradeMutation.isPending}
              >
                {tradeMutation.isPending ? "Submitting..." : "Submit Trade Order"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}