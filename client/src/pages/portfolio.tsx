import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Eye,
  EyeOff,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { SiApple, SiBitcoin, SiTesla, SiGoogle, SiEthereum } from "react-icons/si";
import { allAssets } from "@/lib/marketData";

interface Holding {
  symbol: string;
  name: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  value: number;
  change: number;
  changePercent: number;
  icon: React.ComponentType<any>;
  color: string;
  type: 'stock' | 'crypto';
}

export default function Portfolio() {
  const [showValues, setShowValues] = useState(true);
  const [timeframe, setTimeframe] = useState("1d");
  const [portfolioValue, setPortfolioValue] = useState(0);

  // Get current prices from market data
  const getAssetPrice = (symbol: string) => {
    const asset = allAssets.find(a => a.symbol === symbol);
    return asset ? asset.price : 0;
  };

  const holdings: Holding[] = [
    // Stock Holdings
    {
      symbol: "AAPL",
      name: "Apple Inc.",
      shares: 32,
      avgPrice: 175.25,
      currentPrice: getAssetPrice("AAPL"),
      value: 32 * getAssetPrice("AAPL"),
      change: getAssetPrice("AAPL") - 175.25,
      changePercent: ((getAssetPrice("AAPL") - 175.25) / 175.25) * 100,
      icon: SiApple,
      color: "text-gray-700",
      type: "stock"
    },
    {
      symbol: "TSLA",
      name: "Tesla, Inc.",
      shares: 15,
      avgPrice: 245.80,
      currentPrice: getAssetPrice("TSLA"),
      value: 15 * getAssetPrice("TSLA"),
      change: getAssetPrice("TSLA") - 245.80,
      changePercent: ((getAssetPrice("TSLA") - 245.80) / 245.80) * 100,
      icon: SiTesla,
      color: "text-red-500",
      type: "stock"
    },
    {
      symbol: "GOOGL",
      name: "Alphabet Inc.",
      shares: 23,
      avgPrice: 142.15,
      currentPrice: getAssetPrice("GOOGL"),
      value: 23 * getAssetPrice("GOOGL"),
      change: getAssetPrice("GOOGL") - 142.15,
      changePercent: ((getAssetPrice("GOOGL") - 142.15) / 142.15) * 100,
      icon: SiGoogle,
      color: "text-blue-500",
      type: "stock"
    },
    {
      symbol: "MSFT",
      name: "Microsoft Corp.",
      shares: 12,
      avgPrice: 412.33,
      currentPrice: getAssetPrice("MSFT"),
      value: 12 * getAssetPrice("MSFT"),
      change: getAssetPrice("MSFT") - 412.33,
      changePercent: ((getAssetPrice("MSFT") - 412.33) / 412.33) * 100,
      icon: ({ className }: { className: string }) => (
        <div className={`${className} bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold`}>
          MS
        </div>
      ),
      color: "text-blue-600",
      type: "stock"
    },
    // Crypto Holdings
    {
      symbol: "BTC",
      name: "Bitcoin",
      shares: 0.1234,
      avgPrice: 65420.00,
      currentPrice: getAssetPrice("BTC"),
      value: 0.1234 * getAssetPrice("BTC"),
      change: getAssetPrice("BTC") - 65420.00,
      changePercent: ((getAssetPrice("BTC") - 65420.00) / 65420.00) * 100,
      icon: SiBitcoin,
      color: "text-orange-500",
      type: "crypto"
    },
    {
      symbol: "ETH",
      name: "Ethereum",
      shares: 1.2567,
      avgPrice: 3245.80,
      currentPrice: getAssetPrice("ETH"),
      value: 1.2567 * getAssetPrice("ETH"),
      change: getAssetPrice("ETH") - 3245.80,
      changePercent: ((getAssetPrice("ETH") - 3245.80) / 3245.80) * 100,
      icon: SiEthereum,
      color: "text-blue-500",
      type: "crypto"
    },
    {
      symbol: "SOL",
      name: "Solana",
      shares: 15.67,
      avgPrice: 185.25,
      currentPrice: getAssetPrice("SOL"),
      value: 15.67 * getAssetPrice("SOL"),
      change: getAssetPrice("SOL") - 185.25,
      changePercent: ((getAssetPrice("SOL") - 185.25) / 185.25) * 100,
      icon: ({ className }: { className: string }) => (
        <div className={`${className} bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold`}>
          S
        </div>
      ),
      color: "text-purple-500",
      type: "crypto"
    }
  ];

  const stockHoldings = holdings.filter(h => h.type === 'stock');
  const cryptoHoldings = holdings.filter(h => h.type === 'crypto');
  
  const totalStockValue = stockHoldings.reduce((sum, h) => sum + h.value, 0);
  const totalCryptoValue = cryptoHoldings.reduce((sum, h) => sum + h.value, 0);
  const totalPortfolioValue = totalStockValue + totalCryptoValue;
  
  const totalGainLoss = holdings.reduce((sum, h) => sum + (h.change * h.shares), 0);
  const totalGainLossPercent = (totalGainLoss / (totalPortfolioValue - totalGainLoss)) * 100;

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setPortfolioValue(totalPortfolioValue);
    }, 2000);
    return () => clearInterval(interval);
  }, [totalPortfolioValue]);

  const formatCurrency = (value: number) => {
    return showValues ? `$${value.toLocaleString('en-US', {minimumFractionDigits: 2})}` : "••••••••";
  };

  const formatShares = (shares: number, symbol: string) => {
    const decimals = ['BTC', 'ETH'].includes(symbol) ? 4 : 0;
    return showValues ? shares.toFixed(decimals) : "••••••••";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <PieChart className="h-6 w-6 text-gray-700" />
          <h1 className="text-2xl font-bold text-gray-900">Portfolio</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowValues(!showValues)}
          className="flex items-center space-x-2"
        >
          {showValues ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          <span>{showValues ? "Hide" : "Show"} Values</span>
        </Button>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Portfolio Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPortfolioValue)}</div>
            <div className={`flex items-center text-sm mt-1 ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalGainLoss >= 0 ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
              {showValues ? `${totalGainLoss >= 0 ? '+' : ''}${formatCurrency(totalGainLoss).replace('$', '$')} (${totalGainLossPercent.toFixed(2)}%)` : "••••••••"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Stock Holdings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalStockValue)}</div>
            <div className="text-sm text-gray-500 mt-1">
              {((totalStockValue / totalPortfolioValue) * 100).toFixed(1)}% of portfolio
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Crypto Holdings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCryptoValue)}</div>
            <div className="text-sm text-gray-500 mt-1">
              {((totalCryptoValue / totalPortfolioValue) * 100).toFixed(1)}% of portfolio
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Chart Placeholder */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Portfolio Performance</CardTitle>
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">1D</SelectItem>
                <SelectItem value="1w">1W</SelectItem>
                <SelectItem value="1m">1M</SelectItem>
                <SelectItem value="3m">3M</SelectItem>
                <SelectItem value="1y">1Y</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <BarChart3 className="h-12 w-12 mx-auto mb-2" />
              <p>Portfolio performance chart</p>
              <p className="text-sm">Real-time data visualization</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Holdings Breakdown */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Holdings</TabsTrigger>
          <TabsTrigger value="stocks">Stocks</TabsTrigger>
          <TabsTrigger value="crypto">Crypto</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Holdings</CardTitle>
              <CardDescription>Complete overview of your stock and cryptocurrency investments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {holdings.map((holding) => (
                  <div key={holding.symbol} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <holding.icon className={`h-10 w-10 ${holding.color}`} />
                      <div>
                        <div className="font-medium">{holding.symbol}</div>
                        <div className="text-sm text-gray-500">{holding.name}</div>
                        <div className="text-xs text-gray-400">
                          {formatShares(holding.shares, holding.symbol)} {holding.type === 'stock' ? 'shares' : 'coins'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(holding.value)}</div>
                      <div className={`text-sm ${holding.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {showValues ? `${holding.changePercent >= 0 ? '+' : ''}${holding.changePercent.toFixed(2)}%` : "••••••••"}
                      </div>
                      <div className="text-xs text-gray-500">
                        Avg: {formatCurrency(holding.avgPrice)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stocks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stock Holdings</CardTitle>
              <CardDescription>Your equity investments and their performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stockHoldings.map((holding) => (
                  <div key={holding.symbol} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <holding.icon className={`h-10 w-10 ${holding.color}`} />
                      <div>
                        <div className="font-medium">{holding.symbol}</div>
                        <div className="text-sm text-gray-500">{holding.name}</div>
                        <div className="text-xs text-gray-400">
                          {formatShares(holding.shares, holding.symbol)} shares
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(holding.value)}</div>
                      <div className={`text-sm ${holding.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {showValues ? `${holding.changePercent >= 0 ? '+' : ''}${holding.changePercent.toFixed(2)}%` : "••••••••"}
                      </div>
                      <div className="text-xs text-gray-500">
                        Avg: {formatCurrency(holding.avgPrice)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="crypto" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Crypto Holdings</CardTitle>
              <CardDescription>Your cryptocurrency investments and their performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cryptoHoldings.map((holding) => (
                  <div key={holding.symbol} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <holding.icon className={`h-10 w-10 ${holding.color}`} />
                      <div>
                        <div className="font-medium">{holding.symbol}</div>
                        <div className="text-sm text-gray-500">{holding.name}</div>
                        <div className="text-xs text-gray-400">
                          {formatShares(holding.shares, holding.symbol)} coins
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(holding.value)}</div>
                      <div className={`text-sm ${holding.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {showValues ? `${holding.changePercent >= 0 ? '+' : ''}${holding.changePercent.toFixed(2)}%` : "••••••••"}
                      </div>
                      <div className="text-xs text-gray-500">
                        Avg: {formatCurrency(holding.avgPrice)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}