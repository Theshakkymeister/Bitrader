import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Wallet, 
  Link as LinkIcon, 
  Copy, 
  Send, 
  Download, 
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  QrCode
} from "lucide-react";
import { SiBitcoin, SiEthereum } from "react-icons/si";
import { allAssets } from "@/lib/marketData";

interface WalletData {
  symbol: string;
  name: string;
  balance: number;
  usdValue: number;
  address: string;
  icon: React.ComponentType<any>;
  color: string;
  change24h: number;
}

export default function Wallets() {
  const [connectedWallets, setConnectedWallets] = useState<string[]>([]);
  const [showBalances, setShowBalances] = useState(true);
  const [showAddresses, setShowAddresses] = useState<{[key: string]: boolean}>({});
  const { toast } = useToast();

  // Get current prices from market data
  const getAssetPrice = (symbol: string) => {
    const asset = allAssets.find(a => a.symbol === symbol);
    return asset ? asset.price : 0;
  };

  const wallets: WalletData[] = [
    {
      symbol: "BTC",
      name: "Bitcoin",
      balance: 0.2567,
      usdValue: 0.2567 * getAssetPrice("BTC"),
      address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
      icon: SiBitcoin,
      color: "text-orange-500",
      change24h: 2.34
    },
    {
      symbol: "ETH",
      name: "Ethereum",
      balance: 1.8934,
      usdValue: 1.8934 * getAssetPrice("ETH"),
      address: "0x742d35Cc6C4C8532DC6efB5b9e3B4a8b5d73f123",
      icon: SiEthereum,
      color: "text-blue-500",
      change24h: 1.87
    },
    {
      symbol: "USDT",
      name: "Tether USD",
      balance: 5420.50,
      usdValue: 5420.50,
      address: "0x742d35Cc6C4C8532DC6efB5b9e3B4a8b5d73f456",
      icon: ({ className }: { className: string }) => (
        <div className={`${className} bg-green-500 rounded-full flex items-center justify-center text-white font-bold`}>
          T
        </div>
      ),
      color: "text-green-500",
      change24h: 0.01
    },
    {
      symbol: "SOL",
      name: "Solana",
      balance: 45.67,
      usdValue: 45.67 * getAssetPrice("SOL"),
      address: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
      icon: ({ className }: { className: string }) => (
        <div className={`${className} bg-purple-500 rounded-full flex items-center justify-center text-white font-bold`}>
          S
        </div>
      ),
      color: "text-purple-500",
      change24h: 4.23
    },
    {
      symbol: "USDC",
      name: "USD Coin",
      balance: 2130.25,
      usdValue: 2130.25,
      address: "0x742d35Cc6C4C8532DC6efB5b9e3B4a8b5d73f789",
      icon: ({ className }: { className: string }) => (
        <div className={`${className} bg-blue-600 rounded-full flex items-center justify-center text-white font-bold`}>
          C
        </div>
      ),
      color: "text-blue-600",
      change24h: 0.02
    }
  ];

  const totalValue = wallets.reduce((sum, wallet) => sum + wallet.usdValue, 0);

  const handleConnectWallet = async (walletType: string) => {
    try {
      // Simulate wallet connection
      await new Promise(resolve => setTimeout(resolve, 1500));
      setConnectedWallets(prev => [...prev, walletType]);
      toast({
        title: "Wallet Connected",
        description: `Successfully connected ${walletType}`,
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: `Failed to connect ${walletType}`,
        variant: "destructive"
      });
    }
  };

  const handleDisconnectWallet = (walletType: string) => {
    setConnectedWallets(prev => prev.filter(w => w !== walletType));
    toast({
      title: "Wallet Disconnected",
      description: `${walletType} has been disconnected`,
      variant: "default"
    });
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({
      title: "Address Copied",
      description: "Wallet address copied to clipboard",
      variant: "default"
    });
  };

  const toggleAddressVisibility = (symbol: string) => {
    setShowAddresses(prev => ({
      ...prev,
      [symbol]: !prev[symbol]
    }));
  };

  const formatAddress = (address: string, show: boolean) => {
    if (!show) return "••••••••••••••••••••••••••••••••••••••••";
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Wallet className="h-6 w-6 text-gray-700" />
          <h1 className="text-2xl font-bold text-gray-900">Wallets</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowBalances(!showBalances)}
          className="flex items-center space-x-2"
        >
          {showBalances ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          <span>{showBalances ? "Hide" : "Show"} Balances</span>
        </Button>
      </div>

      {/* Total Portfolio Value */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Total Wallet Value</CardTitle>
          <CardDescription>Combined value of all your cryptocurrency wallets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900">
            {showBalances ? `$${totalValue.toLocaleString('en-US', {minimumFractionDigits: 2})}` : "••••••••"}
          </div>
          <div className="text-sm text-green-600 mt-1">
            +$234.56 (+2.87%) in the last 24h
          </div>
        </CardContent>
      </Card>

      {/* Wallet Connection */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <LinkIcon className="h-5 w-5 text-blue-600" />
            <CardTitle>Wallet Connections</CardTitle>
          </div>
          <CardDescription>
            Connect your external wallets to sync balances and transactions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Trust Wallet */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Wallet className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="font-medium">Trust Wallet</div>
                    <div className="text-sm text-gray-500">Mobile crypto wallet</div>
                  </div>
                </div>
                {connectedWallets.includes("Trust Wallet") ? (
                  <Badge variant="default" className="bg-green-100 text-green-700">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Not Connected
                  </Badge>
                )}
              </div>
              {connectedWallets.includes("Trust Wallet") ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleDisconnectWallet("Trust Wallet")}
                  className="w-full"
                >
                  Disconnect
                </Button>
              ) : (
                <Button 
                  onClick={() => handleConnectWallet("Trust Wallet")}
                  className="w-full"
                  size="sm"
                >
                  Connect Trust Wallet
                </Button>
              )}
            </div>

            {/* Coinbase Wallet */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <div className="text-white font-bold text-sm">CB</div>
                  </div>
                  <div>
                    <div className="font-medium">Coinbase Wallet</div>
                    <div className="text-sm text-gray-500">Self-custody wallet</div>
                  </div>
                </div>
                {connectedWallets.includes("Coinbase Wallet") ? (
                  <Badge variant="default" className="bg-green-100 text-green-700">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Not Connected
                  </Badge>
                )}
              </div>
              {connectedWallets.includes("Coinbase Wallet") ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleDisconnectWallet("Coinbase Wallet")}
                  className="w-full"
                >
                  Disconnect
                </Button>
              ) : (
                <Button 
                  onClick={() => handleConnectWallet("Coinbase Wallet")}
                  className="w-full"
                  size="sm"
                >
                  Connect Coinbase Wallet
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Wallets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {wallets.map((wallet) => (
          <Card key={wallet.symbol}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <wallet.icon className={`h-10 w-10 ${wallet.color}`} />
                  <div>
                    <CardTitle className="text-lg">{wallet.name}</CardTitle>
                    <CardDescription>{wallet.symbol}</CardDescription>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">
                    {showBalances ? wallet.balance.toFixed(4) : "••••••••"}
                  </div>
                  <div className="text-sm text-gray-500">{wallet.symbol}</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* USD Value */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">USD Value</span>
                <div className="text-right">
                  <div className="font-medium">
                    {showBalances ? `$${wallet.usdValue.toLocaleString('en-US', {minimumFractionDigits: 2})}` : "••••••••"}
                  </div>
                  <div className={`text-xs ${wallet.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {wallet.change24h >= 0 ? '+' : ''}{wallet.change24h}% (24h)
                  </div>
                </div>
              </div>

              <Separator />

              {/* Wallet Address */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Wallet Address</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleAddressVisibility(wallet.symbol)}
                  >
                    {showAddresses[wallet.symbol] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <code className="text-xs bg-gray-100 p-2 rounded flex-1 font-mono">
                    {formatAddress(wallet.address, showAddresses[wallet.symbol])}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyAddress(wallet.address)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm" className="flex items-center space-x-1">
                  <Send className="h-4 w-4" />
                  <span>Send</span>
                </Button>
                <Button variant="outline" size="sm" className="flex items-center space-x-1">
                  <Download className="h-4 w-4" />
                  <span>Receive</span>
                </Button>
                <Button variant="outline" size="sm" className="flex items-center space-x-1">
                  <QrCode className="h-4 w-4" />
                  <span>QR</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}