import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { 
  Shield, 
  Settings, 
  Wallet, 
  Users, 
  Activity,
  Plus,
  Edit,
  Trash2,
  LogOut,
  Eye,
  EyeOff,
  BarChart3,
  Database,
  Terminal,
  Home,
  ChevronRight,
  TrendingUp,
  Globe,
  Server,
  Monitor,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertTriangle,
  History,
  Ban,
  UserCheck,
  X,
  Check,
  Loader2,
  Clock
} from "lucide-react";

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  lastLoginAt: string;
}

interface CryptoAddress {
  id: string;
  symbol: string;
  name: string;
  address: string;
  network: string;
  isActive: boolean;
  createdAt: string;
}

interface WebsiteSetting {
  id: string;
  key: string;
  value: string;
  description: string;
  category: string;
  updatedAt: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  registrationIp: string;
  lastLoginIp: string;
  lastLoginAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserDetails extends User {
  portfolio?: {
    id: string;
    totalValue: number;
    buyingPower: number;
    totalProfitLoss: number;
    totalGainLossPercentage: number;
  };
  trades?: any[];
  walletBalances?: {
    currency: string;
    balance: number;
    usdValue: number;
  }[];
}

interface AdminStats {
  totalUsers: number;
  usersRegisteredToday: number;
  usersActiveToday: number;
  activeAlgorithms: number;
  pendingTrades: number;
  activeTrades: number;
  totalRevenue: string;
  pendingDeposits: number;
}

const menuItems = [
  { id: 'overview', label: 'Overview', icon: Home, color: 'text-blue-600' },
  { id: 'trades', label: 'Trade Management', icon: TrendingUp, color: 'text-red-600' },
  { id: 'crypto', label: 'Crypto Addresses', icon: Wallet, color: 'text-green-600' },
  { id: 'settings', label: 'Website Settings', icon: Settings, color: 'text-purple-600' },
  { id: 'users', label: 'User Management', icon: Users, color: 'text-orange-600' },
  { id: 'deposits', label: 'Deposit Requests', icon: DollarSign, color: 'text-yellow-600' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'text-pink-600' },
  { id: 'system', label: 'System Status', icon: Monitor, color: 'text-indigo-600' }
];

export default function AdminDashboard() {
  // All state declarations first
  const [activeSection, setActiveSection] = useState('overview');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showAddresses, setShowAddresses] = useState<{[key: string]: boolean}>({});
  const [newAddress, setNewAddress] = useState({ symbol: '', name: '', address: '', network: '' });
  const [newSetting, setNewSetting] = useState({ key: '', value: '', description: '' });
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [balanceAction, setBalanceAction] = useState<{type: 'add' | 'remove', amount: string}>({type: 'add', amount: ''});
  const [selectedTrades, setSelectedTrades] = useState<string[]>([]);
  const [tradeFilter, setTradeFilter] = useState('all');
  
  // All hooks in consistent order
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // All queries in consistent order - always called regardless of conditions
  const { data: adminUser } = useQuery<AdminUser>({
    queryKey: ["/api/admin/user"],
    retry: false,
  });

  const { data: cryptoAddresses = [] } = useQuery<CryptoAddress[]>({
    queryKey: ["/api/admin/crypto-addresses"],
  });

  const { data: websiteSettings = [] } = useQuery<WebsiteSetting[]>({
    queryKey: ["/api/admin/settings"],
  });

  const { data: adminStats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    refetchInterval: 30000,
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: activeSection === 'users',
  });

  const { data: userDetails, isLoading: userDetailsLoading } = useQuery<UserDetails>({
    queryKey: ["/api/admin/users", selectedUser?.id, "details"],
    enabled: !!selectedUser?.id && showUserModal,
  });

  const { data: depositRequests = [], isLoading: loadingDeposits } = useQuery({
    queryKey: ['/api/admin/deposit-requests'],
    enabled: activeSection === 'deposits',
    refetchInterval: 5000,
  });

  // Fetch all trades for admin management
  const { data: allTrades = [], isLoading: loadingTrades } = useQuery({
    queryKey: ["/api/admin/trades"],
    enabled: activeSection === 'trades',
    refetchInterval: 5000,
  });

  // Filter trades based on status
  const filteredTrades = allTrades.filter((trade: any) => {
    if (tradeFilter === 'pending') return trade.adminApproval === 'pending';
    if (tradeFilter === 'approved') return trade.adminApproval === 'approved';
    if (tradeFilter === 'rejected') return trade.adminApproval === 'rejected';
    return true; // 'all'
  }) || [];

  // All mutations defined at top level to ensure consistent hook order
  const approveDepositMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      await apiRequest('PATCH', `/api/admin/deposit-requests/${id}/approve`, { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/deposit-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({ title: "Success", description: "Deposit request approved successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const rejectDepositMutation = useMutation({
    mutationFn: async ({ id, rejectionReason, notes }: { id: string; rejectionReason: string; notes?: string }) => {
      await apiRequest('PATCH', `/api/admin/deposit-requests/${id}/reject`, { rejectionReason, notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/deposit-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({ title: "Success", description: "Deposit request rejected" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // User management mutations
  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string, isActive: boolean }) => {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive })
      });
      if (!response.ok) throw new Error("Failed to update user status");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User status updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update user status", description: error.message, variant: "destructive" });
    }
  });

  const adjustBalanceMutation = useMutation({
    mutationFn: async ({ userId, amount, type }: { userId: string, amount: number, type: 'add' | 'remove' }) => {
      const response = await fetch(`/api/admin/users/${userId}/balance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, type })
      });
      if (!response.ok) throw new Error("Failed to adjust balance");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setBalanceAction({ type: 'add', amount: '' });
      toast({ title: "Balance adjusted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to adjust balance", description: error.message, variant: "destructive" });
    }
  });

  const approveTradesMutation = useMutation({
    mutationFn: async ({ userId, tradeIds }: { userId: string, tradeIds: string[] }) => {
      const response = await fetch(`/api/admin/users/${userId}/trades/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tradeIds })
      });
      if (!response.ok) throw new Error("Failed to approve trades");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trades"] });
      toast({ title: "Trades approved successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to approve trades", description: error.message, variant: "destructive" });
    }
  });

  // Individual trade approval/rejection
  const approveTradeMutation = useMutation({
    mutationFn: async ({ tradeId, approval, rejectionReason }: { tradeId: string; approval: string; rejectionReason?: string }) => {
      const response = await fetch(`/api/admin/trades/${tradeId}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approval, rejectionReason })
      });
      if (!response.ok) throw new Error("Failed to update trade");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setSelectedTrades([]);
      toast({ title: "Trade updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update trade", description: error.message, variant: "destructive" });
    }
  });

  // Bulk approve selected trades
  const bulkApproveTradesMutation = useMutation({
    mutationFn: async (tradeIds: string[]) => {
      const promises = tradeIds.map(tradeId => 
        fetch(`/api/admin/trades/${tradeId}/approve`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approval: "approved" })
        })
      );
      const responses = await Promise.all(promises);
      const failed = responses.filter(r => !r.ok);
      if (failed.length > 0) throw new Error(`Failed to approve ${failed.length} trades`);
      return responses;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setSelectedTrades([]);
      toast({ title: "All selected trades approved successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Bulk approval failed", description: error.message, variant: "destructive" });
    }
  });

  // Admin logout
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/logout", { 
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Admin logout failed");
      }
    },
    onSuccess: () => {
      toast({
        title: "Logged Out Successfully",
        description: "You have been logged out of the admin panel.",
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/user"] });
      setTimeout(() => {
        window.location.href = "/admin/login";
      }, 1000);
    },
    onError: (error: Error) => {
      toast({
        title: "Logout Failed",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  // Create crypto address mutation
  const createAddressMutation = useMutation({
    mutationFn: (data: { symbol: string; name: string; address: string; network: string }) =>
      fetch("/api/admin/crypto-addresses", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/crypto-addresses"] });
      setNewAddress({ symbol: '', name: '', address: '', network: '' });
      toast({
        title: "Success",
        description: "Crypto address added successfully",
        variant: "default"
      });
    },
  });

  // Update website setting mutation
  const updateSettingMutation = useMutation({
    mutationFn: ({ key, value, description }: { key: string; value: string; description: string }) =>
      fetch(`/api/admin/settings/${key}`, {
        method: "PUT",
        body: JSON.stringify({ value, description }),
        headers: { "Content-Type": "application/json" },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      setNewSetting({ key: '', value: '', description: '' });
      toast({
        title: "Success",
        description: "Setting updated successfully",
        variant: "default"
      });
    },
  });

  const toggleAddressVisibility = (id: string) => {
    setShowAddresses(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAddress.symbol && newAddress.name && newAddress.address && newAddress.network) {
      createAddressMutation.mutate(newAddress);
    }
  };

  const handleUpdateSetting = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSetting.key && newSetting.value) {
      updateSettingMutation.mutate(newSetting);
    }
  };

  // User management action handlers
  const handleVerifyAccount = async (userId: string) => {
    try {
      await toggleUserStatusMutation.mutateAsync({ userId, isActive: true });
      toast({ 
        title: "Account Verified", 
        description: "User account has been verified and activated.",
        variant: "default"
      });
    } catch (error) {
      toast({ 
        title: "Verification Failed", 
        description: "Failed to verify user account.",
        variant: "destructive"
      });
    }
  };

  const handleViewHistory = async (userId: string) => {
    try {
      // Use the existing userDetails data instead of making a separate API call
      if (!userDetails) {
        toast({ 
          title: "History Unavailable", 
          description: "User details are not loaded yet.",
          variant: "destructive"
        });
        return;
      }
      
      // Create a detailed history summary from userDetails
      const tradeCount = userDetails.trades?.length || 0;
      const depositCount = userDetails.depositRequests?.length || 0;
      const accountAge = Math.floor((Date.now() - new Date(userDetails.user?.createdAt || '').getTime()) / (1000 * 60 * 60 * 24));
      const lastActivity = userDetails.user?.lastLoginAt ? new Date(userDetails.user.lastLoginAt).toLocaleString() : 'N/A';
      
      const historyContent = `
User Activity Summary:
- Trade History: ${tradeCount} total trades
- Deposit History: ${depositCount} total deposit requests  
- Last Login: ${lastActivity}
- Account Age: ${accountAge} days
- Portfolio Value: $${userDetails.portfolio?.totalValue?.toFixed(2) || '0.00'}
- Win Rate: ${userDetails.analytics?.winRate || '0.00'}%
      `;
      
      toast({ 
        title: "User History Overview", 
        description: historyContent,
        variant: "default"
      });
    } catch (error) {
      toast({ 
        title: "History Unavailable", 
        description: "Could not retrieve user history at this time.",
        variant: "destructive"
      });
    }
  };

  const handleActivityLog = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/activity-log`);
      if (!response.ok) throw new Error("Failed to fetch activity log");
      
      const activityLog = await response.json();
      
      // Show recent activity in toast
      const recentActivity = activityLog.slice(0, 5).map((activity: any) => 
        `${new Date(activity.timestamp).toLocaleString()}: ${activity.action}`
      ).join('\n');
      
      toast({ 
        title: "Recent Activity Log", 
        description: recentActivity || "No recent activity found.",
        variant: "default"
      });
    } catch (error) {
      toast({ 
        title: "Activity Log Unavailable", 
        description: "Could not retrieve activity log at this time.",
        variant: "destructive"
      });
    }
  };

  const renderOverview = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Developer Dashboard</h2>
          <p className="text-sm sm:text-base text-gray-600 mt-2">System overview and quick stats</p>
        </div>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 self-start sm:self-center">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
          System Online
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
          <Card className="border-0 shadow-md bg-gradient-to-r from-blue-50 to-blue-100">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Crypto Addresses</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-900">{cryptoAddresses.length}</p>
                </div>
                <Wallet className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
          <Card className="border-0 shadow-md bg-gradient-to-r from-green-50 to-green-100">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Website Settings</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-900">{websiteSettings.length}</p>
                </div>
                <Settings className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
          <Card className="border-0 shadow-md bg-gradient-to-r from-purple-50 to-purple-100">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Active Users</p>
                  <p className="text-xl sm:text-2xl font-bold text-purple-900">1,247</p>
                </div>
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
          <Card className="border-0 shadow-md bg-gradient-to-r from-orange-50 to-orange-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium">Server Status</p>
                  <p className="text-2xl font-bold text-orange-900">99.9%</p>
                </div>
                <Server className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">System started successfully</span>
              <span className="text-xs text-gray-400 ml-auto">2 min ago</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Admin user logged in</span>
              <span className="text-xs text-gray-400 ml-auto">5 min ago</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Database backup completed</span>
              <span className="text-xs text-gray-400 ml-auto">1 hour ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderCryptoAddresses = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Crypto Addresses</h2>
        <p className="text-gray-600 mt-2">Manage cryptocurrency deposit addresses</p>
      </div>

      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5 text-green-600" />
            <span>Add New Address</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddAddress} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="symbol">Symbol</Label>
              <Input
                id="symbol"
                value={newAddress.symbol}
                onChange={(e) => setNewAddress({ ...newAddress, symbol: e.target.value })}
                placeholder="BTC, ETH, etc."
                required
              />
            </div>
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newAddress.name}
                onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                placeholder="Bitcoin, Ethereum, etc."
                required
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={newAddress.address}
                onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                placeholder="Wallet address"
                required
              />
            </div>
            <div>
              <Label htmlFor="network">Network</Label>
              <Input
                id="network"
                value={newAddress.network}
                onChange={(e) => setNewAddress({ ...newAddress, network: e.target.value })}
                placeholder="mainnet, testnet, etc."
                required
              />
            </div>
            <div className="md:col-span-2">
              <Button 
                type="submit" 
                className="w-full"
                disabled={createAddressMutation.isPending}
              >
                {createAddressMutation.isPending ? "Adding..." : "Add Address"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {cryptoAddresses.map((address: CryptoAddress, index: number) => (
          <motion.div
            key={address.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="shadow-md border-0 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold">{address.symbol}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{address.name}</h3>
                      <p className="text-sm text-gray-500">{address.network}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={address.isActive ? "default" : "secondary"}>
                      {address.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleAddressVisibility(address.id)}
                    >
                      {showAddresses[address.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <AnimatePresence>
                  {showAddresses[address.id] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-4 pt-4 border-t border-gray-200"
                    >
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm font-mono text-gray-700 break-all">{address.address}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  const renderUserManagement = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">User Management</h2>
          <p className="text-sm sm:text-base text-gray-600 mt-2">Monitor and manage platform users</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
          <Card className="border-0 shadow-md bg-gradient-to-r from-green-50 to-green-100">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Total Users</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-900">{adminStats?.totalUsers || 0}</p>
                  <p className="text-xs text-green-600 mt-1">Platform registered</p>
                </div>
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
          <Card className="border-0 shadow-md bg-gradient-to-r from-blue-50 to-blue-100">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Active Today</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-900">{adminStats?.usersActiveToday || 0}</p>
                  <p className="text-xs text-blue-600 mt-1">{adminStats?.totalUsers ? Math.round((adminStats.usersActiveToday / adminStats.totalUsers) * 100) : 0}% of total</p>
                </div>
                <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
          <Card className="border-0 shadow-md bg-gradient-to-r from-purple-50 to-purple-100">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">New Signups</p>
                  <p className="text-xl sm:text-2xl font-bold text-purple-900">{adminStats?.usersRegisteredToday || 0}</p>
                  <p className="text-xs text-purple-600 mt-1">Today</p>
                </div>
                <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-blue-600" />
            <span>User Directory ({users.length} users)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {usersLoading ? (
              <div className="text-center py-8 text-gray-500">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p>Loading users...</p>
              </div>
            ) : !users || users.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No users registered yet</p>
              </div>
            ) : (
              users.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors space-y-3 sm:space-y-0"
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-sm">
                        {user.firstName && user.lastName 
                          ? `${user.firstName[0]}${user.lastName[0]}` 
                          : user.username[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">
                        {user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName}` 
                          : user.username}
                      </p>
                      <p className="text-sm text-gray-500 truncate">{user.email}</p>
                      <div className="hidden sm:flex items-center space-x-4 text-xs text-gray-400 mt-1">
                        <span>Reg IP: {user.registrationIp || 'N/A'}</span>
                        <span>Last IP: {user.lastLoginIp || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                    <div className="text-left sm:text-right">
                      <p className="text-sm text-gray-900">
                        Joined {new Date(user.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {user.lastLoginAt 
                          ? `Last login: ${new Date(user.lastLoginAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}` 
                          : 'Never logged in'}
                      </p>
                    </div>
                    <div className="flex space-x-1 flex-wrap">
                        <Badge
                          variant={user.isActive ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {user.isActive ? "Active" : "Suspended"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUserModal(true);
                          }}
                          className="hover:bg-blue-50 hover:text-blue-600 h-8 px-2"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  // User Details Modal Component
  const renderUserDetailsModal = () => (
    <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-gray-900">
            <Users className="h-5 w-5 text-blue-600" />
            <span>User Account Management</span>
            {selectedUser && (
              <Badge variant={selectedUser.isActive ? "default" : "destructive"}>
                {selectedUser.isActive ? "Active" : "Suspended"}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            View and manage user account details, portfolio information, and trading activity.
          </DialogDescription>
        </DialogHeader>

        {selectedUser && (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
              <TabsTrigger value="trades">Trades</TabsTrigger>
              <TabsTrigger value="deposits">Deposits</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <UserCheck className="h-4 w-4" />
                    <span>User Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 bg-white">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Name</Label>
                    <p className="text-sm text-gray-900 font-medium">
                      {selectedUser.firstName && selectedUser.lastName 
                        ? `${selectedUser.firstName} ${selectedUser.lastName}` 
                        : selectedUser.username}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Email</Label>
                    <p className="text-sm text-gray-900 font-medium">{selectedUser.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Username</Label>
                    <p className="text-sm text-gray-900 font-medium">{selectedUser.username}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Status</Label>
                    <Badge variant={selectedUser.isActive ? "default" : "destructive"}>
                      {selectedUser.isActive ? "Active" : "Suspended"}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Registration IP</Label>
                    <p className="text-sm text-gray-900">{selectedUser.registrationIp || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Last Login IP</Label>
                    <p className="text-sm text-gray-900">{selectedUser.lastLoginIp || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Joined</Label>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedUser.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Last Login</Label>
                    <p className="text-sm text-gray-900">
                      {selectedUser.lastLoginAt 
                        ? new Date(selectedUser.lastLoginAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Never logged in'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="portfolio" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4" />
                    <span>Portfolio Overview</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="bg-white">
                  {userDetailsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                    </div>
                  ) : userDetails?.portfolio ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Total Portfolio Value</Label>
                        <p className="text-lg font-semibold text-gray-900">
                          ${typeof userDetails.portfolio.totalValue === 'number' ? userDetails.portfolio.totalValue.toFixed(2) : parseFloat(userDetails.portfolio.totalValue || '0').toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Wallets + Stocks combined
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Available Balance</Label>
                        <p className="text-lg font-semibold text-green-600">
                          ${typeof userDetails.portfolio.availableBalance === 'number' ? userDetails.portfolio.availableBalance.toFixed(2) : parseFloat(userDetails.portfolio.availableBalance || '0').toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Cash available for trading
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Total P&L</Label>
                        <p className={`text-lg font-semibold ${userDetails.portfolio.totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${typeof userDetails.portfolio.totalProfitLoss === 'number' ? userDetails.portfolio.totalProfitLoss.toFixed(2) : parseFloat(userDetails.portfolio.totalProfitLoss || '0').toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Total profit/loss from trades
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Total Balance</Label>
                        <p className="text-lg font-semibold text-blue-600">
                          ${typeof userDetails.portfolio.totalBalance === 'number' ? userDetails.portfolio.totalBalance.toFixed(2) : parseFloat(userDetails.portfolio.totalBalance || '0').toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Account total balance
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">No portfolio data available</p>
                  )}
                </CardContent>
              </Card>

              {userDetails?.walletBalances && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Wallet Balances</span>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Total Wallet Value</p>
                        <p className="text-lg font-semibold text-green-600">
                          ${userDetails.walletBalances.reduce((sum, wallet) => {
                            return sum + (typeof wallet.usdValue === 'number' ? wallet.usdValue : parseFloat(wallet.usdValue || '0'));
                          }, 0).toFixed(2)}
                        </p>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="bg-white">
                    <div className="space-y-2">
                      {userDetails.walletBalances.map((balance, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium text-gray-900">{balance.currency}</span>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">{typeof balance.balance === 'number' ? balance.balance.toFixed(8) : parseFloat(balance.balance || '0').toFixed(8)}</p>
                            <p className="text-sm text-gray-600">${typeof balance.usdValue === 'number' ? balance.usdValue.toFixed(2) : parseFloat(balance.usdValue || '0').toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="trades" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <History className="h-4 w-4" />
                      <span>Trading History</span>
                    </div>
                    <Button 
                      onClick={() => approveTradesMutation.mutate({ 
                        userId: selectedUser.id, 
                        tradeIds: userDetails?.trades?.filter(t => t.adminApproval === 'pending').map(t => t.id) || []
                      })}
                      disabled={!userDetails?.trades?.some(t => t.adminApproval === 'pending')}
                      size="sm"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve All Pending
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="bg-white">
                  {userDetailsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                    </div>
                  ) : userDetails?.trades?.length ? (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {userDetails.trades.map((trade, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{trade.symbol}</p>
                            <p className="text-sm text-gray-600">{trade.type} • {trade.quantity} shares</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">${typeof trade.price === 'number' ? trade.price.toFixed(2) : parseFloat(trade.price || '0').toFixed(2)}</p>
                            <Badge variant={
                              trade.adminApproval === 'approved' ? 'default' : 
                              trade.adminApproval === 'pending' ? 'secondary' : 'destructive'
                            }>
                              {trade.adminApproval}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No trades found</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="deposits" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4" />
                    <span>Deposit History</span>
                    <Badge variant="outline">
                      {userDetails?.depositRequests?.length || 0} Total
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {userDetailsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                      <span className="ml-2 text-gray-600">Loading deposit history...</span>
                    </div>
                  ) : !userDetails?.depositRequests?.length ? (
                    <div className="text-center py-8">
                      <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">No deposit requests found</p>
                      <p className="text-gray-400 text-xs mt-1">User hasn't made any deposit requests yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {userDetails.depositRequests.map((deposit: any, index: number) => (
                        <motion.div
                          key={deposit.id || index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-semibold text-gray-900">
                                {deposit.amount} {deposit.cryptoSymbol}
                              </span>
                              <Badge 
                                variant={
                                  deposit.status === 'approved' ? 'default' : 
                                  deposit.status === 'pending' ? 'secondary' : 'destructive'
                                }
                              >
                                {deposit.status}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div className="flex items-center space-x-4">
                                <span>USD Value: ${deposit.usdValue || '0.00'}</span>
                                <span>Network: {deposit.network || 'N/A'}</span>
                              </div>
                              <div className="text-xs text-gray-500">
                                Requested: {new Date(deposit.createdAt).toLocaleString()}
                                {deposit.approvedAt && (
                                  <span className="ml-4">
                                    Processed: {new Date(deposit.approvedAt).toLocaleString()}
                                  </span>
                                )}
                              </div>
                              {deposit.transactionHash && (
                                <div className="text-xs text-gray-500">
                                  Tx Hash: {deposit.transactionHash.slice(0, 16)}...
                                </div>
                              )}
                              {deposit.rejectionReason && (
                                <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                                  Rejection Reason: {deposit.rejectionReason}
                                </div>
                              )}
                              {deposit.notes && (
                                <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                                  Admin Notes: {deposit.notes}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            {deposit.status === 'approved' && (
                              <CheckCircle className="h-6 w-6 text-green-600" />
                            )}
                            {deposit.status === 'pending' && (
                              <Clock className="h-6 w-6 text-orange-600" />
                            )}
                            {deposit.status === 'rejected' && (
                              <XCircle className="h-6 w-6 text-red-600" />
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="actions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-4 w-4" />
                    <span>Account Actions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Adjust Balance</Label>
                      <div className="flex space-x-2">
                        <Input
                          type="number"
                          placeholder="Amount"
                          value={balanceAction.amount}
                          onChange={(e) => setBalanceAction({...balanceAction, amount: e.target.value})}
                          className="flex-1"
                        />
                        <Button
                          variant={balanceAction.type === 'add' ? 'default' : 'outline'}
                          onClick={() => setBalanceAction({...balanceAction, type: 'add'})}
                          size="sm"
                        >
                          Add
                        </Button>
                        <Button
                          variant={balanceAction.type === 'remove' ? 'default' : 'outline'}
                          onClick={() => setBalanceAction({...balanceAction, type: 'remove'})}
                          size="sm"
                        >
                          Remove
                        </Button>
                      </div>
                      <Button
                        onClick={() => adjustBalanceMutation.mutate({
                          userId: selectedUser.id,
                          amount: parseFloat(balanceAction.amount),
                          type: balanceAction.type
                        })}
                        disabled={!balanceAction.amount || isNaN(parseFloat(balanceAction.amount))}
                        className="w-full"
                      >
                        <DollarSign className="h-4 w-4 mr-1" />
                        {balanceAction.type === 'add' ? 'Add' : 'Remove'} ${balanceAction.amount || '0'}
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label>Account Status</Label>
                      <Button
                        variant={selectedUser.isActive ? "destructive" : "default"}
                        onClick={() => toggleUserStatusMutation.mutate({ 
                          userId: selectedUser.id, 
                          isActive: !selectedUser.isActive 
                        })}
                        className="w-full"
                      >
                        {selectedUser.isActive ? (
                          <>
                            <Ban className="h-4 w-4 mr-1" />
                            Suspend Account
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4 mr-1" />
                            Activate Account
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleVerifyAccount(selectedUser.id)}
                      disabled={selectedUser.isActive}
                      className="w-full"
                    >
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      <span className="text-xs sm:text-sm">{selectedUser.isActive ? 'Verified' : 'Verify Account'}</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewHistory(selectedUser.id)}
                      className="w-full"
                    >
                      <History className="h-4 w-4 mr-1" />
                      <span className="text-xs sm:text-sm">View Full History</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleActivityLog(selectedUser.id)}
                      className="w-full"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      <span className="text-xs sm:text-sm">Activity Log</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );

  const renderAnalytics = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h2>
        <p className="text-gray-600 mt-2">Live platform performance and usage metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
          <Card className="border-0 shadow-md bg-gradient-to-r from-blue-50 to-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Active Trades</p>
                  <p className="text-2xl font-bold text-blue-900">{adminStats?.activeTrades || 0}</p>
                  <p className="text-xs text-blue-600 mt-1">Executed orders</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
          <Card className="border-0 shadow-md bg-gradient-to-r from-green-50 to-green-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Platform Revenue</p>
                  <p className="text-2xl font-bold text-green-900">{adminStats?.totalRevenue || '$0'}</p>
                  <p className="text-xs text-green-600 mt-1">From user portfolios</p>
                </div>
                <BarChart3 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
          <Card className="border-0 shadow-md bg-gradient-to-r from-purple-50 to-purple-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Pending Deposits</p>
                  <p className="text-2xl font-bold text-purple-900">{adminStats?.pendingDeposits || 0}</p>
                  <p className="text-xs text-purple-600 mt-1">Users with $0 balance</p>
                </div>
                <Database className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
          <Card className="border-0 shadow-md bg-gradient-to-r from-orange-50 to-orange-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium">Total Users</p>
                  <p className="text-2xl font-bold text-orange-900">{adminStats?.totalUsers || 0}</p>
                  <p className="text-xs text-orange-600 mt-1">Platform registered</p>
                </div>
                <Activity className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <span>Platform Statistics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Registered Users</span>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{adminStats?.totalUsers || 0}</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-600">
                    Active
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Users Active Today</span>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{adminStats?.usersActiveToday || 0}</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-600">
                    Online
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">New Signups Today</span>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{adminStats?.usersRegisteredToday || 0}</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-600">
                    New
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Platform Revenue</span>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{adminStats?.totalRevenue || '$0'}</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-600">
                    Total
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active Trades</span>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{adminStats?.activeTrades || 0}</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-600">
                    Executed
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pending Deposits</span>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{adminStats?.pendingDeposits || 0}</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-600">
                    Awaiting
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-600" />
              <span>Live User Directory</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-60 overflow-y-auto">
              {usersLoading ? (
                <div className="text-center py-4 text-gray-500">
                  <div className="animate-spin h-6 w-6 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-sm">Loading users...</p>
                </div>
              ) : !users || users.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No users registered yet</p>
                </div>
              ) : (
                users.slice(0, 5).map((user, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-xs">
                          {user.firstName && user.lastName 
                            ? `${user.firstName[0]}${user.lastName[0]}` 
                            : user.username[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {user.firstName && user.lastName 
                            ? `${user.firstName} ${user.lastName}` 
                            : user.username}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                      <div className={`w-2 h-2 rounded-full mt-1 ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    </div>
                  </div>
                ))
              )}
              {users && users.length > 5 && (
                <div className="text-center pt-2">
                  <button 
                    onClick={() => setActiveSection('userManagement')}
                    className="text-blue-600 text-sm hover:text-blue-800"
                  >
                    View all {users.length} users →
                  </button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );

  const renderSystemStatus = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-3xl font-bold text-gray-900">System Status</h2>
        <p className="text-gray-600 mt-2">Real-time system monitoring and health</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
          <Card className="border-0 shadow-md bg-gradient-to-r from-green-50 to-green-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Server Uptime</p>
                  <p className="text-2xl font-bold text-green-900">99.9%</p>
                  <p className="text-xs text-green-600 mt-1">15 days 4 hours</p>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
          <Card className="border-0 shadow-md bg-gradient-to-r from-blue-50 to-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Database</p>
                  <p className="text-2xl font-bold text-blue-900">Healthy</p>
                  <p className="text-xs text-blue-600 mt-1">45ms avg query time</p>
                </div>
                <Database className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
          <Card className="border-0 shadow-md bg-gradient-to-r from-purple-50 to-purple-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Memory Usage</p>
                  <p className="text-2xl font-bold text-purple-900">64%</p>
                  <p className="text-xs text-purple-600 mt-1">2.1GB / 3.3GB</p>
                </div>
                <Monitor className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
          <Card className="border-0 shadow-md bg-gradient-to-r from-orange-50 to-orange-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium">CPU Load</p>
                  <p className="text-2xl font-bold text-orange-900">23%</p>
                  <p className="text-xs text-orange-600 mt-1">Normal range</p>
                </div>
                <Activity className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <span>Service Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { service: 'Authentication API', status: 'operational', uptime: '99.9%' },
                { service: 'Trading Engine', status: 'operational', uptime: '99.8%' },
                { service: 'Database Cluster', status: 'operational', uptime: '100%' },
                { service: 'Payment Gateway', status: 'operational', uptime: '99.7%' },
                { service: 'WebSocket Server', status: 'operational', uptime: '99.9%' },
                { service: 'Email Service', status: 'maintenance', uptime: '98.5%' }
              ].map((service, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      service.status === 'operational' ? 'bg-green-500' : 
                      service.status === 'maintenance' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <span className="font-medium">{service.service}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-gray-600">{service.uptime}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Monitor className="h-5 w-5 text-green-600" />
              <span>Recent System Events</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { event: 'Database backup completed', time: '2 min ago', type: 'success' },
                { event: 'Security scan passed', time: '15 min ago', type: 'success' },
                { event: 'Email service maintenance started', time: '1 hour ago', type: 'warning' },
                { event: 'SSL certificate renewed', time: '2 hours ago', type: 'success' },
                { event: 'Server restart completed', time: '6 hours ago', type: 'info' },
                { event: 'Daily backup scheduled', time: '1 day ago', type: 'info' }
              ].map((event, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    event.type === 'success' ? 'bg-green-500' :
                    event.type === 'warning' ? 'bg-yellow-500' :
                    event.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{event.event}</p>
                    <p className="text-xs text-gray-500">{event.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );

  const renderWebsiteSettings = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Website Settings</h2>
        <p className="text-gray-600 mt-2">Configure global platform parameters</p>
      </div>

      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5 text-blue-600" />
            <span>Add/Update Setting</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateSetting} className="space-y-4">
            <div>
              <Label htmlFor="setting-key">Setting Key</Label>
              <Input
                id="setting-key"
                value={newSetting.key}
                onChange={(e) => setNewSetting({ ...newSetting, key: e.target.value })}
                placeholder="site_name, maintenance_mode, etc."
                required
              />
            </div>
            <div>
              <Label htmlFor="setting-value">Value</Label>
              <Input
                id="setting-value"
                value={newSetting.value}
                onChange={(e) => setNewSetting({ ...newSetting, value: e.target.value })}
                placeholder="Setting value"
                required
              />
            </div>
            <div>
              <Label htmlFor="setting-description">Description</Label>
              <Textarea
                id="setting-description"
                value={newSetting.description}
                onChange={(e) => setNewSetting({ ...newSetting, description: e.target.value })}
                placeholder="Brief description of this setting"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={updateSettingMutation.isPending}
            >
              {updateSettingMutation.isPending ? "Updating..." : "Update Setting"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {websiteSettings.map((setting: WebsiteSetting, index: number) => (
          <motion.div
            key={setting.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="shadow-md border-0 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{setting.key}</h3>
                    <p className="text-sm text-gray-500 mt-1">{setting.description}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">{setting.category}</Badge>
                    <p className="text-sm text-gray-600 mt-2 font-mono">{setting.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  const renderDepositRequests = () => {

    if (loadingDeposits) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <div className="flex items-center space-x-3">
          <DollarSign className="h-6 w-6 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-900">Deposit Requests</h2>
          <Badge variant="outline" className="ml-auto">
            {depositRequests?.length || 0} Total
          </Badge>
        </div>

        {!depositRequests?.length ? (
          <Card className="shadow-md border-0">
            <CardContent className="py-12 text-center">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No deposit requests found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {depositRequests.map((request: any, index: number) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="shadow-md border-0 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-semibold text-gray-900">
                            {parseFloat(request.amount || '0').toFixed(8)} {request.cryptoSymbol}
                          </h3>
                          <Badge 
                            variant={
                              request.status === 'pending' ? 'outline' :
                              request.status === 'approved' ? 'default' : 'destructive'
                            }
                          >
                            {request.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          USD Value: ${parseFloat(request.usdValue || '0').toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">
                          Network: {request.network} • {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                        {request.transactionHash && (
                          <p className="text-xs text-gray-400 font-mono">
                            TX: {request.transactionHash.substring(0, 20)}...
                          </p>
                        )}
                      </div>
                      
                      {request.status === 'pending' && (
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-600 hover:bg-green-50"
                            onClick={() => approveDepositMutation.mutate({ id: request.id })}
                            disabled={approveDepositMutation.isPending}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-600 hover:bg-red-50"
                            onClick={() => rejectDepositMutation.mutate({ 
                              id: request.id, 
                              rejectionReason: 'Invalid transaction or insufficient confirmation' 
                            })}
                            disabled={rejectDepositMutation.isPending}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    );
  };

  const renderTradeManagement = () => {
    const pendingCount = filteredTrades.filter((t: any) => t.adminApproval === 'pending').length;
    const approvedCount = filteredTrades.filter((t: any) => t.adminApproval === 'approved').length;
    const rejectedCount = filteredTrades.filter((t: any) => t.adminApproval === 'rejected').length;

    const handleSelectAll = () => {
      if (selectedTrades.length === filteredTrades.length) {
        setSelectedTrades([]);
      } else {
        setSelectedTrades(filteredTrades.map((t: any) => t.id));
      }
    };

    const handleSelectTrade = (tradeId: string) => {
      setSelectedTrades(prev => 
        prev.includes(tradeId) 
          ? prev.filter(id => id !== tradeId)
          : [...prev, tradeId]
      );
    };

    const calculateProfitLoss = (trade: any) => {
      if (!trade.currentPrice || !trade.price) return { pnl: 0, pnlPercent: 0 };
      
      const openPrice = parseFloat(trade.price);
      const currentPrice = parseFloat(trade.currentPrice);
      const quantity = parseFloat(trade.quantity);
      
      if (trade.type === 'buy') {
        const pnl = (currentPrice - openPrice) * quantity;
        const pnlPercent = ((currentPrice - openPrice) / openPrice) * 100;
        return { pnl, pnlPercent };
      } else {
        const pnl = (openPrice - currentPrice) * quantity;
        const pnlPercent = ((openPrice - currentPrice) / openPrice) * 100;
        return { pnl, pnlPercent };
      }
    };

    if (loadingTrades) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Trade Management</h2>
            <p className="text-sm sm:text-base text-gray-600 mt-2">Review and approve pending trades</p>
          </div>
          <Badge variant="outline" className="self-start sm:self-center">
            {allTrades.length} Total Trades
          </Badge>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
            <Card className="border-0 shadow-md bg-gradient-to-r from-orange-50 to-orange-100">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-600 text-sm font-medium">Pending Approval</p>
                    <p className="text-2xl font-bold text-orange-900">{pendingCount}</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
            <Card className="border-0 shadow-md bg-gradient-to-r from-green-50 to-green-100">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 text-sm font-medium">Approved</p>
                    <p className="text-2xl font-bold text-green-900">{approvedCount}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
            <Card className="border-0 shadow-md bg-gradient-to-r from-red-50 to-red-100">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-600 text-sm font-medium">Rejected</p>
                    <p className="text-2xl font-bold text-red-900">{rejectedCount}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filters and Bulk Actions */}
        <Card className="shadow-lg border-0">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              {/* Filter Buttons */}
              <div className="flex flex-wrap gap-2">
                {['all', 'pending', 'approved', 'rejected'].map((filter) => (
                  <Button
                    key={filter}
                    variant={tradeFilter === filter ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTradeFilter(filter)}
                    className="text-xs capitalize"
                  >
                    {filter} {filter === 'pending' && pendingCount > 0 && `(${pendingCount})`}
                  </Button>
                ))}
              </div>

              {/* Bulk Actions */}
              {selectedTrades.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{selectedTrades.length} selected</span>
                  <Button
                    size="sm"
                    onClick={() => bulkApproveTradesMutation.mutate(selectedTrades)}
                    disabled={bulkApproveTradesMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve All
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedTrades([])}
                  >
                    Clear
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Trades List */}
        {!filteredTrades.length ? (
          <Card className="shadow-md border-0">
            <CardContent className="py-12 text-center">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No trades found for the selected filter</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Trades ({filteredTrades.length})</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedTrades.length === filteredTrades.length && filteredTrades.length > 0}
                    onChange={handleSelectAll}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-600">Select All</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredTrades.map((trade: any, index: number) => {
                  const { pnl, pnlPercent } = calculateProfitLoss(trade);
                  const isSelected = selectedTrades.includes(trade.id);
                  
                  return (
                    <motion.div
                      key={trade.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                        isSelected 
                          ? 'border-blue-300 bg-blue-50' 
                          : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        {/* Trade Info */}
                        <div className="flex items-center space-x-3 flex-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectTrade(trade.id)}
                            className="rounded"
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-semibold text-gray-900">{trade.symbol}</span>
                              <Badge variant={trade.type === 'buy' ? 'default' : 'destructive'}>
                                {trade.type.toUpperCase()}
                              </Badge>
                              <Badge 
                                variant={
                                  trade.adminApproval === 'approved' ? 'default' : 
                                  trade.adminApproval === 'pending' ? 'secondary' : 'destructive'
                                }
                              >
                                {trade.adminApproval}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div className="flex flex-wrap gap-x-4 gap-y-1">
                                <span>Qty: {parseFloat(trade.quantity).toFixed(2)}</span>
                                <span>Price: ${parseFloat(trade.price).toFixed(2)}</span>
                                <span>Total: ${parseFloat(trade.totalAmount || '0').toFixed(2)}</span>
                              </div>
                              {trade.currentPrice && (
                                <div className="flex items-center space-x-4">
                                  <span>Current: ${parseFloat(trade.currentPrice).toFixed(2)}</span>
                                  <span className={`font-medium ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    P&L: {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)
                                  </span>
                                </div>
                              )}
                              <div className="text-xs text-gray-500">
                                User: {trade.userId} • {new Date(trade.createdAt).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        {trade.adminApproval === 'pending' && (
                          <div className="flex items-center space-x-2 ml-4">
                            <Button
                              size="sm"
                              onClick={() => approveTradeMutation.mutate({ 
                                tradeId: trade.id, 
                                approval: "approved" 
                              })}
                              disabled={approveTradeMutation.isPending}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => approveTradeMutation.mutate({ 
                                tradeId: trade.id, 
                                approval: "rejected",
                                rejectionReason: "Risk management decision"
                              })}
                              disabled={approveTradeMutation.isPending}
                              className="text-red-600 border-red-600 hover:bg-red-50 px-3 py-1"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    );
  };

  const handleSectionChange = async (sectionId: string) => {
    if (sectionId === activeSection) return;
    
    setIsTransitioning(true);
    
    // Small delay to show transition effect
    setTimeout(() => {
      setActiveSection(sectionId);
      setIsTransitioning(false);
    }, 150);
  };

  const renderSection = () => {
    const content = (() => {
      switch (activeSection) {
        case 'overview':
          return renderOverview();
        case 'crypto':
          return renderCryptoAddresses();
        case 'settings':
          return renderWebsiteSettings();
        case 'users':
          return renderUserManagement();
        case 'analytics':
          return renderAnalytics();
        case 'trades':
          return renderTradeManagement();
        case 'deposits':
          return renderDepositRequests();
        case 'system':
          return renderSystemStatus();
        default:
          return renderOverview();
      }
    })();

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, x: 20, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -20, scale: 0.95 }}
          transition={{ 
            duration: 0.3, 
            ease: [0.4, 0.0, 0.2, 1],
            scale: { duration: 0.2 }
          }}
          className={isTransitioning ? 'pointer-events-none' : ''}
        >
          {content}
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Terminal className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 font-mono">Developer Portal</h1>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{adminUser?.firstName} {adminUser?.lastName}</p>
                <p className="text-xs text-gray-500">{adminUser?.role}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logoutMutation.mutate()}
                className="text-gray-600 hover:text-red-600"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
          {/* Mobile Navigation */}
          <div className="lg:hidden mb-4">
            <Card className="shadow-sm border-0 overflow-hidden">
              <CardContent className="p-0">
                <div className="relative">
                  {/* Direct scrollable container for better touch support */}
                  <div 
                    className="overflow-x-auto scrollbar-hide"
                    style={{ 
                      scrollBehavior: 'smooth',
                      WebkitOverflowScrolling: 'touch',
                      msOverflowStyle: 'none',
                      scrollbarWidth: 'none'
                    }}
                  >
                    <motion.div 
                      className="flex space-x-3 p-4 pb-2 w-max"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      {menuItems.map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1, duration: 0.3 }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            variant={activeSection === item.id ? "default" : "ghost"}
                            size="sm"
                            onClick={() => handleSectionChange(item.id)}
                            className={`flex-shrink-0 transition-all duration-300 whitespace-nowrap ${
                              activeSection === item.id 
                                ? 'shadow-md bg-blue-600 text-white' 
                                : 'hover:bg-gray-100 hover:shadow-sm'
                            }`}
                          >
                            <item.icon className="h-4 w-4 mr-1" />
                            <span className="text-xs font-medium">{item.label}</span>
                          </Button>
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>
                  
                  {/* Scroll indicators with enhanced visibility */}
                  <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white via-white/90 to-transparent pointer-events-none z-10"></div>
                  <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white via-white/90 to-transparent pointer-events-none z-10"></div>
                  
                  {/* Scroll hint arrows */}
                  <div className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none animate-pulse">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <div className="absolute left-1 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none animate-pulse">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Desktop Sidebar Navigation */}
          <div className="hidden lg:block lg:w-64 flex-shrink-0">
            <Card className="shadow-lg border-0 sticky top-8 overflow-hidden">
              <CardContent className="p-0 relative">
                <ScrollArea className="h-[calc(100vh-200px)]" style={{ scrollBehavior: 'smooth' }}>
                  <motion.div 
                    className="p-4 space-y-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    {menuItems.map((item, index) => (
                      <motion.button
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ 
                          opacity: 1, 
                          x: 0,
                          backgroundColor: activeSection === item.id ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0)',
                          borderColor: activeSection === item.id ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0)'
                        }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                        whileHover={{ scale: 1.02, x: 5 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSectionChange(item.id)}
                        className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-all duration-300 ${
                          activeSection === item.id
                            ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200 shadow-sm'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
                        }`}
                      >
                        <motion.div
                          animate={{ 
                            rotate: activeSection === item.id ? 360 : 0,
                            scale: activeSection === item.id ? 1.1 : 1
                          }}
                          transition={{ duration: 0.3 }}
                        >
                          <item.icon className={`h-5 w-5 ${activeSection === item.id ? item.color : 'text-gray-400'}`} />
                        </motion.div>
                        <span className="font-medium">{item.label}</span>
                        {activeSection === item.id && (
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          >
                            <ChevronRight className="h-4 w-4 ml-auto text-blue-600" />
                          </motion.div>
                        )}
                      </motion.button>
                    ))}
                  </motion.div>
                </ScrollArea>
                
                {/* Scroll indicators for desktop sidebar */}
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
                <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white to-transparent pointer-events-none z-10"></div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderSection()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
      {renderUserDetailsModal()}
    </div>
  );
}