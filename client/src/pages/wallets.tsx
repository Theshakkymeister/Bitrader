import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  QrCode,
  X
} from "lucide-react";
import { SiBitcoin, SiEthereum } from "react-icons/si";
import { allAssets } from "@/lib/marketData";

interface WalletData {
  symbol: string;
  name: string;
  balance: number;
  usdValue: number;
  address?: string;
  icon: React.ComponentType<any>;
  color: string;
  change24h: number;
}

interface CryptoAddress {
  id: string;
  symbol: string;
  address: string;
  qrCode?: string;
  isActive: boolean;
}

export default function Wallets() {
  const [connectedWallets, setConnectedWallets] = useState<string[]>([]);
  const [showBalances, setShowBalances] = useState(true);
  const [showAddresses, setShowAddresses] = useState<{[key: string]: boolean}>({});
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<WalletData | null>(null);
  const [sendAmount, setSendAmount] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const { toast } = useToast();

  // Fetch admin-managed crypto addresses
  const { data: cryptoAddresses = [] } = useQuery<CryptoAddress[]>({
    queryKey: ['/api/crypto-addresses'],
  });

  // Fetch user wallet balances from database
  const { data: userWallets = [], refetch: refetchWallets } = useQuery<any[]>({
    queryKey: ['/api/wallets'],
    refetchInterval: 5000, // Refresh every 5 seconds to show updated balances
  });

  // Get current prices from market data
  const getAssetPrice = (symbol: string) => {
    const asset = allAssets.find(a => a.symbol === symbol);
    return asset?.price || 0; // Use actual market price or 0 if not available
  };

  // Merge database balances with wallet display data
  const getWalletBalance = (symbol: string) => {
    const userWallet = userWallets.find((w: any) => w.symbol === symbol);
    return userWallet ? parseFloat(userWallet.balance || '0') : 0;
  };

  const getWalletUsdValue = (symbol: string) => {
    const userWallet = userWallets.find((w: any) => w.symbol === symbol);
    if (userWallet && userWallet.usdValue) {
      return parseFloat(userWallet.usdValue);
    }
    // Calculate USD value from balance and current price if not stored
    const balance = getWalletBalance(symbol);
    const price = getAssetPrice(symbol);
    return balance * price;
  };

  // Wallet data with real balances from database
  const wallets: WalletData[] = [
    {
      symbol: "BTC",
      name: "Bitcoin",
      balance: getWalletBalance("BTC"),
      usdValue: getWalletUsdValue("BTC"),
      address: cryptoAddresses.find(addr => addr.symbol === 'BTC')?.address,
      icon: SiBitcoin,
      color: "text-orange-500",
      change24h: -2.45
    },
    {
      symbol: "ETH", 
      name: "Ethereum",
      balance: getWalletBalance("ETH"),
      usdValue: getWalletUsdValue("ETH"),
      address: cryptoAddresses.find(addr => addr.symbol === 'ETH')?.address,
      icon: SiEthereum,
      color: "text-blue-500",
      change24h: 1.82
    },
    {
      symbol: "USDT",
      name: "Tether USD",
      balance: getWalletBalance("USDT"),
      usdValue: getWalletUsdValue("USDT"),
      address: cryptoAddresses.find(addr => addr.symbol === 'USDT')?.address,
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
      balance: getWalletBalance("SOL"),
      usdValue: getWalletUsdValue("SOL"),
      address: cryptoAddresses.find(addr => addr.symbol === 'SOL')?.address,
      icon: ({ className }: { className: string }) => (
        <div className={`${className} bg-purple-500 rounded-full flex items-center justify-center text-white font-bold`}>
          S
        </div>
      ),
      color: "text-purple-500",
      change24h: 5.23
    },
    {
      symbol: "USDC",
      name: "USD Coin",
      balance: getWalletBalance("USDC"),
      usdValue: getWalletUsdValue("USDC"),
      address: cryptoAddresses.find(addr => addr.symbol === 'USDC')?.address,
      icon: ({ className }: { className: string }) => (
        <div className={`${className} bg-blue-600 rounded-full flex items-center justify-center text-white font-bold`}>
          C
        </div>
      ),
      color: "text-blue-600",
      change24h: 0.00
    }
  ];

  const totalValue = wallets.reduce((sum, wallet) => sum + wallet.usdValue, 0);

  const handleConnectWallet = async (walletType: string) => {
    try {
      if (walletType === "Trust Wallet") {
        // Check if on mobile device
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
          // Try to open Trust Wallet app directly
          const trustWalletDeepLink = "trust://";
          const trustWalletAppStore = "https://apps.apple.com/app/trust-crypto-bitcoin-wallet/id1288339409";
          const trustWalletPlayStore = "https://play.google.com/store/apps/details?id=com.wallet.crypto.trustapp";
          
          // Try to open the app
          window.location.href = trustWalletDeepLink;
          
          // Fallback to app store after a short delay if app doesn't open
          setTimeout(() => {
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            const storeUrl = isIOS ? trustWalletAppStore : trustWalletPlayStore;
            window.open(storeUrl, '_blank');
          }, 2500);
          
          toast({
            title: "Opening Trust Wallet",
            description: "If Trust Wallet doesn't open, you'll be redirected to download it",
            variant: "default"
          });
        } else {
          // On desktop, show download link
          toast({
            title: "Trust Wallet Mobile Required",
            description: "Trust Wallet is a mobile app. Please use your phone or download the mobile app",
            variant: "default"
          });
          
          // Open Trust Wallet website for desktop users
          window.open("https://trustwallet.com/download", '_blank');
        }
      } else if (walletType === "Coinbase Wallet") {
        // Handle Coinbase Wallet connection
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
          const coinbaseDeepLink = "cbwallet://";
          const coinbaseAppStore = "https://apps.apple.com/app/coinbase-wallet/id1278383455";
          const coinbasePlayStore = "https://play.google.com/store/apps/details?id=org.toshi";
          
          window.location.href = coinbaseDeepLink;
          
          setTimeout(() => {
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            const storeUrl = isIOS ? coinbaseAppStore : coinbasePlayStore;
            window.open(storeUrl, '_blank');
          }, 2500);
          
          toast({
            title: "Opening Coinbase Wallet",
            description: "If Coinbase Wallet doesn't open, you'll be redirected to download it",
            variant: "default"
          });
        } else {
          window.open("https://www.coinbase.com/wallet/downloads", '_blank');
          toast({
            title: "Coinbase Wallet Mobile Required",
            description: "Coinbase Wallet is a mobile app. Please use your phone or download the mobile app",
            variant: "default"
          });
        }
      }
      
      // Simulate connection process and mark as connected
      await new Promise(resolve => setTimeout(resolve, 1000));
      setConnectedWallets(prev => [...prev, walletType]);
      
      toast({
        title: "Wallet Connected",
        description: `${walletType} has been successfully connected to your account`,
        variant: "default"
      });
      
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: `Failed to connect ${walletType}. Please try again.`,
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

  const copyAddress = (address: string | undefined) => {
    if (!address) {
      toast({
        title: "No Address Available",
        description: "This wallet doesn't have an address yet",
        variant: "destructive"
      });
      return;
    }
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

  const formatAddress = (address: string | undefined, show: boolean) => {
    if (!address) return "No address available";
    if (!show) return "••••••••••••••••••••••••••••••••••••••••";
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const handleSend = (wallet: WalletData) => {
    setSelectedWallet(wallet);
    setSendModalOpen(true);
  };

  const handleReceive = (wallet: WalletData) => {
    setSelectedWallet(wallet);
    setReceiveModalOpen(true);
  };

  const handleQrCode = (wallet: WalletData) => {
    setSelectedWallet(wallet);
    setQrModalOpen(true);
  };

  const executeSend = () => {
    if (!selectedWallet || !sendAmount || !recipientAddress) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Simulate send transaction
    toast({
      title: "Transaction Submitted",
      description: `Sending ${sendAmount} ${selectedWallet.symbol} to ${recipientAddress.slice(0, 8)}...`,
      variant: "default"
    });

    // Reset form and close modal
    setSendAmount("");
    setRecipientAddress("");
    setSendModalOpen(false);
  };

  const generateQRCode = (address: string) => {
    // Simple QR code representation using characters
    const qrPattern = [
      "██████████████████████████████",
      "██  ██    ████    ██  ████  ██",
      "██  ██████  ████████  ██████████",
      "██    ██  ██    ████    ██  ██",
      "██████  ████████  ██████████████",
      "██    ████    ██████    ██  ██",
      "██████████████████████████████",
      "        ██████████████        ",
      "██████    ██    ████    ██████",
      "██  ████████████  ██████  ████",
      "██████  ██    ████    ████  ██",
      "██    ████████  ██████████████",
      "██████████████████████████████"
    ];
    
    return qrPattern.map((row, i) => (
      <div key={i} className="font-mono text-xs leading-none">
        {row}
      </div>
    ));
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
          <div className="text-sm text-gray-500 mt-1">
            {totalValue > 0 
              ? `Portfolio value across ${userWallets.length} crypto assets` 
              : "Connect wallets to add funds"}
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
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full" size="sm">
                      Connect Trust Wallet
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center space-x-2">
                        <Wallet className="h-5 w-5 text-blue-600" />
                        <span>Connect Trust Wallet</span>
                      </DialogTitle>
                      <DialogDescription>
                        Connect your Trust Wallet to sync your cryptocurrency balances and manage your assets.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="border rounded-lg p-4 bg-blue-50">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                            <Wallet className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <div className="font-medium">Trust Wallet</div>
                            <div className="text-sm text-gray-600">Mobile crypto wallet with 70M+ users</div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 mb-4">
                          Trust Wallet is a secure mobile wallet that supports 4.5+ million assets across 100+ blockchains.
                        </div>
                        <Button 
                          onClick={() => handleConnectWallet("Trust Wallet")}
                          className="w-full"
                          size="sm"
                        >
                          <LinkIcon className="h-4 w-4 mr-2" />
                          Connect Trust Wallet
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
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
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full" size="sm">
                      Connect Coinbase Wallet
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center space-x-2">
                        <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center">
                          <span className="text-white font-bold text-xs">CB</span>
                        </div>
                        <span>Connect Coinbase Wallet</span>
                      </DialogTitle>
                      <DialogDescription>
                        Connect your Coinbase Wallet to sync your cryptocurrency balances and manage your assets.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="border rounded-lg p-4 bg-blue-50">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                            <div className="text-white font-bold">CB</div>
                          </div>
                          <div>
                            <div className="font-medium">Coinbase Wallet</div>
                            <div className="text-sm text-gray-600">Self-custody wallet by Coinbase</div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 mb-4">
                          Coinbase Wallet is a self-custody wallet that gives you complete control of your crypto, NFTs, and DeFi activity.
                        </div>
                        <Button 
                          onClick={() => handleConnectWallet("Coinbase Wallet")}
                          className="w-full"
                          size="sm"
                        >
                          <LinkIcon className="h-4 w-4 mr-2" />
                          Connect Coinbase Wallet
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
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
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center space-x-1"
                  onClick={() => handleSend(wallet)}
                >
                  <Send className="h-4 w-4" />
                  <span>Send</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center space-x-1"
                  onClick={() => handleReceive(wallet)}
                >
                  <Download className="h-4 w-4" />
                  <span>Receive</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center space-x-1"
                  onClick={() => handleQrCode(wallet)}
                >
                  <QrCode className="h-4 w-4" />
                  <span>QR</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Send Modal */}
      <Dialog open={sendModalOpen} onOpenChange={setSendModalOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-gray-900">
              <Send className="h-5 w-5 text-blue-600" />
              <span className="text-gray-900">Send {selectedWallet?.symbol}</span>
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Send {selectedWallet?.name} to another wallet address
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipient" className="text-gray-700 font-medium">Recipient Address</Label>
              <Input
                id="recipient"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                placeholder="Enter wallet address..."
                className="font-mono text-sm border-gray-300 text-gray-900 bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-gray-700 font-medium">Amount</Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  placeholder="0.0000"
                  step="0.0001"
                  min="0"
                  className="border-gray-300 text-gray-900 bg-white"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 font-medium">
                  {selectedWallet?.symbol}
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                <AlertCircle className="h-4 w-4 inline mr-1" />
                Transactions cannot be reversed. Please verify the recipient address carefully.
              </p>
            </div>
            <div className="flex space-x-2 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setSendModalOpen(false)}
                className="flex-1 text-gray-700 border-gray-300"
              >
                Cancel
              </Button>
              <Button 
                onClick={executeSend}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Send {selectedWallet?.symbol}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receive Modal */}
      <Dialog open={receiveModalOpen} onOpenChange={setReceiveModalOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-gray-900">
              <Download className="h-5 w-5 text-green-600" />
              <span className="text-gray-900">Receive {selectedWallet?.symbol}</span>
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Share this address to receive {selectedWallet?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedWallet?.address ? (
              <>
                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium">Your {selectedWallet?.symbol} Address</Label>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <code className="text-sm font-mono break-all text-gray-900">
                      {selectedWallet?.address}
                    </code>
                  </div>
                </div>
                <div className="flex space-x-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => copyAddress(selectedWallet?.address || "")}
                    className="flex-1 text-gray-700 border-gray-300"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    <span className="text-gray-700">Copy Address</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setReceiveModalOpen(false);
                      handleQrCode(selectedWallet!);
                    }}
                    className="flex-1 text-gray-700 border-gray-300"
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    <span className="text-gray-700">Show QR Code</span>
                  </Button>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <CheckCircle className="h-4 w-4 inline mr-1" />
                    Only send {selectedWallet?.symbol} to this address. Sending other currencies may result in permanent loss.
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Address Not Available</h3>
                <p className="text-gray-600 mb-4">
                  The deposit address for {selectedWallet?.symbol} hasn't been set up yet by the administrator.
                </p>
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                    Please contact support or check back later when the deposit address is available.
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Code Modal */}
      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-gray-900">
              <QrCode className="h-5 w-5 text-purple-600" />
              <span className="text-gray-900">{selectedWallet?.symbol} QR Code</span>
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Scan this QR code to get the wallet address
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedWallet?.address ? (
              <>
                <div className="flex justify-center">
                  <div className="p-4 bg-white border-2 border-gray-300 rounded-lg shadow-sm">
                    <div className="text-center space-y-1">
                      <div className="text-xs text-gray-500 mb-2">QR Code</div>
                      <div className="text-black leading-none">
                        {generateQRCode(selectedWallet?.address || "")}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium">Wallet Address</Label>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <code className="text-xs font-mono break-all text-gray-900">
                      {selectedWallet?.address}
                    </code>
                  </div>
                </div>
                <div className="flex space-x-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => copyAddress(selectedWallet?.address || "")}
                    className="flex-1 text-gray-700 border-gray-300"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    <span className="text-gray-700">Copy Address</span>
                  </Button>
                  <Button
                    onClick={() => setQrModalOpen(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
                  >
                    <span className="text-white">Close</span>
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">QR Code Not Available</h3>
                <p className="text-gray-600 mb-4">
                  Cannot generate QR code because the deposit address for {selectedWallet?.symbol} hasn't been configured by the administrator.
                </p>
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                    Please contact support to set up the deposit address for this cryptocurrency.
                  </p>
                </div>
                <div className="pt-4">
                  <Button
                    onClick={() => setQrModalOpen(false)}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white"
                  >
                    <span className="text-white">Close</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}