import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { TrendingUp, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

export default function TradingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [symbol, setSymbol] = useState("");
  const [assetType, setAssetType] = useState("stock");
  const [orderType, setOrderType] = useState<"market" | "limit" | "stop">("market");
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [quantity, setQuantity] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [stopPrice, setStopPrice] = useState("");

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

  return (
    <motion.div 
      className="min-h-screen bg-gray-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Live Trading</h1>
          <p className="text-gray-600">Professional trading platform with real-time market data</p>
          
          {/* Buying Power */}
          <motion.div 
            className="mt-4 p-4 rounded-lg bg-white border border-green-200 shadow-sm"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ 
              boxShadow: "0 4px 12px rgba(34, 197, 94, 0.15)",
              transition: { duration: 0.2 }
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Buying Power</span>
              <motion.span 
                className="text-2xl font-bold text-gray-600"
                animate={{ 
                  textShadow: "0 0 8px rgba(107, 114, 128, 0.3)"
                }}
                transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
              >
                $0.00
              </motion.span>
            </div>
          </motion.div>
        </motion.div>

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
                  <motion.div 
                    className="flex rounded-lg overflow-hidden border border-gray-300 relative"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                  >
                    <motion.div
                      className={`absolute inset-0 w-1/2 rounded-lg ${
                        tradeType === 'buy' ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      animate={{
                        x: tradeType === 'buy' ? 0 : '100%',
                        backgroundColor: tradeType === 'buy' ? '#22c55e' : '#ef4444'
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                    
                    <button
                      type="button"
                      onClick={() => setTradeType('buy')}
                      className={`flex-1 py-3 px-4 text-center font-medium text-sm transition-all duration-200 relative z-10 ${
                        tradeType === 'buy' ? 'text-white' : 'text-gray-700 hover:bg-green-50'
                      }`}
                    >
                      BUY
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setTradeType('sell')}
                      className={`flex-1 py-3 px-4 text-center font-medium text-sm transition-all duration-200 relative z-10 ${
                        tradeType === 'sell' ? 'text-white' : 'text-gray-700 hover:bg-red-50'
                      }`}
                    >
                      SELL
                    </button>
                  </motion.div>

                  {/* Order Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-700">Order Type</Label>
                      <Select value={orderType} onValueChange={(value: "market" | "limit" | "stop") => setOrderType(value)}>
                        <SelectTrigger className="border-gray-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="market">Market Order</SelectItem>
                          <SelectItem value="limit">Limit Order</SelectItem>
                          <SelectItem value="stop">Stop Order</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-gray-700">Quantity</Label>
                      <Input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="0"
                        className="border-gray-300"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>

                  {/* Conditional Price Fields */}
                  {orderType === "limit" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Label className="text-gray-700">Limit Price</Label>
                      <Input
                        type="number"
                        value={limitPrice}
                        onChange={(e) => setLimitPrice(e.target.value)}
                        placeholder="0.00"
                        className="border-gray-300"
                        min="0"
                        step="0.01"
                      />
                    </motion.div>
                  )}

                  {orderType === "stop" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Label className="text-gray-700">Stop Price</Label>
                      <Input
                        type="number"
                        value={stopPrice}
                        onChange={(e) => setStopPrice(e.target.value)}
                        placeholder="0.00"
                        className="border-gray-300"
                        min="0"
                        step="0.01"
                      />
                    </motion.div>
                  )}

                  {/* Submit Button */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="submit"
                      disabled={tradeMutation.isPending}
                      className={`w-full py-3 text-white font-medium text-lg rounded-lg transition-all duration-200 ${
                        tradeType === 'buy' 
                          ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-400' 
                          : 'bg-red-600 hover:bg-red-700 disabled:bg-red-400'
                      } shadow-lg hover:shadow-xl`}
                    >
                      {tradeMutation.isPending ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Submitting...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <DollarSign className="w-5 h-5" />
                          <span>{tradeType === 'buy' ? 'Place Buy Order' : 'Place Sell Order'}</span>
                        </div>
                      )}
                    </Button>
                  </motion.div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Market Information - Right Side */}
          <div className="space-y-6">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900 text-lg">Market Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className="text-red-600 font-medium">Market Closed</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Next Open</span>
                  <span className="text-gray-900 font-medium">9:30 AM EST</span>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-xs text-gray-500">
                    Orders placed outside market hours will be queued for the next trading session.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900 text-lg">Important Notice</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-gray-600">
                  <p>• All trades require admin approval before execution</p>
                  <p>• Deposit funds via Wallets to increase buying power</p>
                  <p>• Market prices shown are for reference only</p>
                  <p>• Orders may take 1-2 business days to process</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </motion.div>
  );
}