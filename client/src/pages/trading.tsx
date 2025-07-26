import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { TrendingUp, TrendingDown, DollarSign, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

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

// Mock market data for demo - in production this would come from real APIs
const mockMarketData: MarketData[] = [
  { symbol: "AAPL", name: "Apple Inc.", price: 189.50, change: 2.35, changePercent: 1.26, volume: 52340000 },
  { symbol: "TSLA", name: "Tesla Inc.", price: 248.42, change: -3.22, changePercent: -1.28, volume: 98520000 },
  { symbol: "SPY", name: "SPDR S&P 500 ETF", price: 445.67, change: 1.89, changePercent: 0.43, volume: 45620000 },
  { symbol: "BTC", name: "Bitcoin", price: 43250.00, change: 850.50, changePercent: 2.01, volume: 28430000 },
  { symbol: "ETH", name: "Ethereum", price: 2485.30, change: -45.20, changePercent: -1.79, volume: 15240000 },
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
        {data.volume && (
          <p className="text-xs text-muted-foreground">Vol: {(data.volume / 1000000).toFixed(1)}M</p>
        )}
      </CardContent>
    </Card>
  );
}

function TradeForm({ selectedAsset, onTradeSubmit }: { selectedAsset?: MarketData, onTradeSubmit: () => void }) {
  const [orderType, setOrderType] = useState<"market" | "limit" | "stop">("market");
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [quantity, setQuantity] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [stopPrice, setStopPrice] = useState("");
  const [symbol, setSymbol] = useState("");
  const [assetType, setAssetType] = useState("stock");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (selectedAsset) {
      setSymbol(selectedAsset.symbol);
      setAssetType(selectedAsset.symbol === 'BTC' || selectedAsset.symbol === 'ETH' ? 'crypto' : 
                  selectedAsset.symbol === 'SPY' ? 'etf' : 'stock');
    }
  }, [selectedAsset]);

  const placeTradeMutation = useMutation({
    mutationFn: async (tradeData: any) => {
      const response = await apiRequest("POST", "/api/trades", tradeData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Trade Order Placed",
        description: "Your trade order has been submitted for admin approval.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      onTradeSubmit();
      // Reset form
      setQuantity("");
      setLimitPrice("");
      setStopPrice("");
    },
    onError: (error: any) => {
      toast({
        title: "Trade Failed",
        description: error.message || "Failed to place trade order",
        variant: "destructive",
      });
    },
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

    const currentPrice = selectedAsset?.price || 0;
    const tradeQuantity = parseFloat(quantity);
    const price = orderType === "limit" ? parseFloat(limitPrice) : currentPrice;
    
    const tradeData = {
      symbol,
      assetType,
      type: tradeType,
      orderType,
      quantity: tradeQuantity,
      price: currentPrice,
      ...(orderType === "limit" && { limitPrice: parseFloat(limitPrice) }),
      ...(orderType === "stop" && { stopPrice: parseFloat(stopPrice) }),
      totalAmount: tradeQuantity * price,
    };

    placeTradeMutation.mutate(tradeData);
  };

  const estimatedTotal = selectedAsset && quantity ? 
    (parseFloat(quantity) * (orderType === "limit" && limitPrice ? parseFloat(limitPrice) : selectedAsset.price)) : 0;

  return (
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

          {selectedAsset && (
            <div className="bg-muted p-3 rounded-lg">
              <div className="flex justify-between items-center text-sm">
                <span>Current Price:</span>
                <span className="font-semibold">${selectedAsset.price.toFixed(2)}</span>
              </div>
              {quantity && (
                <div className="flex justify-between items-center text-sm mt-1">
                  <span>Estimated Total:</span>
                  <span className="font-semibold">${estimatedTotal.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={placeTradeMutation.isPending}>
            {placeTradeMutation.isPending ? "Placing Order..." : `Place ${tradeType.toUpperCase()} Order`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function TradeStatusBadge({ status, adminApproval }: { status: string, adminApproval: string }) {
  if (adminApproval === "pending") {
    return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending Approval</Badge>;
  }
  if (adminApproval === "approved") {
    return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
  }
  if (adminApproval === "rejected") {
    return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
  }
  if (status === "executed") {
    return <Badge variant="default" className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Executed</Badge>;
  }
  return <Badge variant="outline"><AlertCircle className="w-3 h-3 mr-1" />{status}</Badge>;
}

function TradeHistory() {
  const { data: trades, isLoading } = useQuery<Trade[]>({
    queryKey: ["/api/trades"],
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading trades...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Trade Orders</CardTitle>
        <CardDescription>View your trade history and order status</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          {trades && trades.length > 0 ? (
            <div className="space-y-4">
              {trades.map((trade) => (
                <div key={trade.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">{trade.symbol || 'Unknown Asset'}</h4>
                      <p className="text-sm text-muted-foreground">
                        {trade.type?.toUpperCase() || 'BUY'} • {trade.orderType?.toUpperCase() || 'MARKET'} • {trade.assetType?.toUpperCase() || 'STOCK'}
                      </p>
                    </div>
                    <TradeStatusBadge status={trade.status} adminApproval={trade.adminApproval} />
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Quantity</p>
                      <p className="font-medium">{trade.quantity ? parseFloat(trade.quantity).toLocaleString() : '0'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Price</p>
                      <p className="font-medium">${trade.price ? parseFloat(trade.price).toFixed(2) : '0.00'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total</p>
                      <p className="font-medium">${trade.totalAmount ? parseFloat(trade.totalAmount).toFixed(2) : '0.00'}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Placed on {new Date(trade.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <div className="mb-4">
                <p className="text-lg font-medium">No trades yet</p>
                <p className="text-sm">Your trading activity will appear here once you place orders.</p>
                <p className="text-sm mt-2 text-blue-600">💡 All trades require admin approval before execution</p>
              </div>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default function TradingPage() {
  const { user } = useAuth();
  const [selectedAsset, setSelectedAsset] = useState<MarketData>();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTradeSubmit = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Live Trading</h1>
          <p className="text-muted-foreground">Trade stocks, ETFs, crypto, and options with admin approval</p>
        </div>
        <Badge variant="outline" className="text-blue-600 border-blue-600">
          <AlertCircle className="w-3 h-3 mr-1" />
          All trades require admin approval
        </Badge>
      </div>

      <Tabs defaultValue="markets" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="markets">Markets</TabsTrigger>
          <TabsTrigger value="trade">Trade</TabsTrigger>
          <TabsTrigger value="orders">My Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="markets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Market Data</CardTitle>
              <CardDescription>Click on any asset to start trading</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockMarketData.map((data) => (
                  <div key={data.symbol} onClick={() => setSelectedAsset(data)}>
                    <MarketDataCard data={data} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trade" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TradeForm selectedAsset={selectedAsset} onTradeSubmit={handleTradeSubmit} />
            {selectedAsset && (
              <Card>
                <CardHeader>
                  <CardTitle>Asset Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-2xl font-bold">{selectedAsset.symbol}</h3>
                      <p className="text-muted-foreground">{selectedAsset.name}</p>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Current Price</p>
                        <p className="text-xl font-bold">${selectedAsset.price.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">24h Change</p>
                        <p className={`text-xl font-bold ${selectedAsset.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedAsset.change >= 0 ? '+' : ''}{selectedAsset.change.toFixed(2)} ({selectedAsset.changePercent.toFixed(2)}%)
                        </p>
                      </div>
                    </div>
                    {selectedAsset.volume && (
                      <div>
                        <p className="text-sm text-muted-foreground">24h Volume</p>
                        <p className="font-semibold">{(selectedAsset.volume / 1000000).toFixed(1)}M</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="orders" key={refreshKey}>
          <TradeHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}