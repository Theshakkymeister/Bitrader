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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
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
  X
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
}

const menuItems = [
  { id: 'overview', label: 'Overview', icon: Home, color: 'text-blue-600' },
  { id: 'crypto', label: 'Crypto Addresses', icon: Wallet, color: 'text-green-600' },
  { id: 'settings', label: 'Website Settings', icon: Settings, color: 'text-purple-600' },
  { id: 'users', label: 'User Management', icon: Users, color: 'text-orange-600' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'text-pink-600' },
  { id: 'system', label: 'System Status', icon: Monitor, color: 'text-indigo-600' }
];

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState('overview');
  const [showAddresses, setShowAddresses] = useState<{[key: string]: boolean}>({});
  const [newAddress, setNewAddress] = useState({ symbol: '', name: '', address: '', network: '' });
  const [newSetting, setNewSetting] = useState({ key: '', value: '', description: '' });
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [balanceAction, setBalanceAction] = useState<{type: 'add' | 'remove', amount: string}>({type: 'add', amount: ''});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current admin user
  const { data: adminUser } = useQuery<AdminUser>({
    queryKey: ["/api/admin/user"],
    retry: false,
  });

  // Get crypto addresses
  const { data: cryptoAddresses = [] } = useQuery<CryptoAddress[]>({
    queryKey: ["/api/admin/crypto-addresses"],
  });

  // Get website settings
  const { data: websiteSettings = [] } = useQuery<WebsiteSetting[]>({
    queryKey: ["/api/admin/settings"],
  });

  // Get admin stats
  const { data: adminStats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Get users for user management
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: activeSection === 'users',
  });

  // Get detailed user data when modal is open
  const { data: userDetails, isLoading: userDetailsLoading } = useQuery<UserDetails>({
    queryKey: ["/api/admin/users", selectedUser?.id, "details"],
    enabled: !!selectedUser?.id && showUserModal,
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
      toast({ title: "Trades approved successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to approve trades", description: error.message, variant: "destructive" });
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
      const response = await fetch(`/api/admin/users/${userId}/history`);
      if (!response.ok) throw new Error("Failed to fetch user history");
      
      const history = await response.json();
      
      // Create a detailed history modal content
      const historyContent = `
User Activity History:
- Login History: ${history.loginCount || 0} total logins
- Trade History: ${history.tradeCount || 0} total trades  
- Deposit History: ${history.depositCount || 0} total deposits
- Last Activity: ${history.lastActivity || 'N/A'}
- Account Age: ${Math.floor((Date.now() - new Date(selectedUser?.createdAt || '').getTime()) / (1000 * 60 * 60 * 24))} days
      `;
      
      toast({ 
        title: "User History", 
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
      <div>
        <h2 className="text-3xl font-bold text-gray-900">User Management</h2>
        <p className="text-gray-600 mt-2">Monitor and manage platform users</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
          <Card className="border-0 shadow-md bg-gradient-to-r from-green-50 to-green-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Total Users</p>
                  <p className="text-2xl font-bold text-green-900">{adminStats?.totalUsers || 0}</p>
                  <p className="text-xs text-green-600 mt-1">Platform registered</p>
                </div>
                <Users className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
          <Card className="border-0 shadow-md bg-gradient-to-r from-blue-50 to-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Active Today</p>
                  <p className="text-2xl font-bold text-blue-900">{adminStats?.usersActiveToday || 0}</p>
                  <p className="text-xs text-blue-600 mt-1">{adminStats?.totalUsers ? Math.round((adminStats.usersActiveToday / adminStats.totalUsers) * 100) : 0}% of total</p>
                </div>
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
          <Card className="border-0 shadow-md bg-gradient-to-r from-purple-50 to-purple-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">New Signups</p>
                  <p className="text-2xl font-bold text-purple-900">{adminStats?.usersRegisteredToday || 0}</p>
                  <p className="text-xs text-purple-600 mt-1">Today</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
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
        <CardContent>
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
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {user.firstName && user.lastName 
                          ? `${user.firstName[0]}${user.lastName[0]}` 
                          : user.username[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName}` 
                          : user.username}
                      </p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
                        <span>Reg IP: {user.registrationIp || 'N/A'}</span>
                        <span>Last IP: {user.lastLoginIp || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex items-center space-x-3">
                    <div className="flex flex-col space-y-2">
                      <div>
                        <p className="text-sm text-gray-900">
                          Joined {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {user.lastLoginAt 
                            ? `Last login: ${new Date(user.lastLoginAt).toLocaleDateString()}` 
                            : 'Never logged in'}
                        </p>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUserModal(true);
                          }}
                          className="px-2 py-1 text-xs"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant={user.isActive ? "destructive" : "default"}
                          onClick={() => toggleUserStatusMutation.mutate({ 
                            userId: user.id, 
                            isActive: !user.isActive 
                          })}
                          className="px-2 py-1 text-xs"
                        >
                          {user.isActive ? (
                            <>
                              <Ban className="h-3 w-3 mr-1" />
                              Suspend
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-3 w-3 mr-1" />
                              Activate
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-blue-600" />
            <span>User Account Management</span>
            {selectedUser && (
              <Badge variant={selectedUser.isActive ? "default" : "destructive"}>
                {selectedUser.isActive ? "Active" : "Suspended"}
              </Badge>
            )}
          </DialogTitle>
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
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Name</Label>
                    <p className="text-sm">
                      {selectedUser.firstName && selectedUser.lastName 
                        ? `${selectedUser.firstName} ${selectedUser.lastName}` 
                        : selectedUser.username}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Email</Label>
                    <p className="text-sm">{selectedUser.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Username</Label>
                    <p className="text-sm">{selectedUser.username}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Status</Label>
                    <Badge variant={selectedUser.isActive ? "default" : "destructive"}>
                      {selectedUser.isActive ? "Active" : "Suspended"}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Registration IP</Label>
                    <p className="text-sm">{selectedUser.registrationIp || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Last Login IP</Label>
                    <p className="text-sm">{selectedUser.lastLoginIp || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Joined</Label>
                    <p className="text-sm">{new Date(selectedUser.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Last Login</Label>
                    <p className="text-sm">
                      {selectedUser.lastLoginAt 
                        ? new Date(selectedUser.lastLoginAt).toLocaleString() 
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
                <CardContent>
                  {userDetailsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                    </div>
                  ) : userDetails?.portfolio ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Total Value</Label>
                        <p className="text-lg font-semibold">${userDetails.portfolio.totalValue.toFixed(2)}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Buying Power</Label>
                        <p className="text-lg font-semibold text-green-600">${userDetails.portfolio.buyingPower.toFixed(2)}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">P&L</Label>
                        <p className={`text-lg font-semibold ${userDetails.portfolio.totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${userDetails.portfolio.totalProfitLoss.toFixed(2)} ({userDetails.portfolio.totalGainLossPercentage.toFixed(2)}%)
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
                    <CardTitle>Wallet Balances</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {userDetails.walletBalances.map((balance, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium">{balance.currency}</span>
                          <div className="text-right">
                            <p className="font-semibold">{balance.balance.toFixed(8)}</p>
                            <p className="text-sm text-gray-500">${balance.usdValue.toFixed(2)}</p>
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
                <CardContent>
                  {userDetailsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                    </div>
                  ) : userDetails?.trades?.length ? (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {userDetails.trades.map((trade, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{trade.symbol}</p>
                            <p className="text-sm text-gray-500">{trade.type} • {trade.quantity} shares</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">${trade.price.toFixed(2)}</p>
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
                    <p className="text-gray-500">No trades found</p>
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
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500">Deposit history will be displayed here when available</p>
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
        <p className="text-gray-600 mt-2">Platform performance and usage metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
          <Card className="border-0 shadow-md bg-gradient-to-r from-blue-50 to-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Total Trades</p>
                  <p className="text-2xl font-bold text-blue-900">12,847</p>
                  <p className="text-xs text-blue-600 mt-1">+8.2% from last month</p>
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
                  <p className="text-green-600 text-sm font-medium">Revenue</p>
                  <p className="text-2xl font-bold text-green-900">$284K</p>
                  <p className="text-xs text-green-600 mt-1">+12.5% from last month</p>
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
                  <p className="text-purple-600 text-sm font-medium">API Calls</p>
                  <p className="text-2xl font-bold text-purple-900">1.2M</p>
                  <p className="text-xs text-purple-600 mt-1">+15.3% from last month</p>
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
                  <p className="text-orange-600 text-sm font-medium">Avg Response</p>
                  <p className="text-2xl font-bold text-orange-900">145ms</p>
                  <p className="text-xs text-orange-600 mt-1">-5.2% from last month</p>
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
              <span>Trading Volume (7 days)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { day: 'Monday', volume: '$45,230', growth: '+12%' },
                { day: 'Tuesday', volume: '$52,840', growth: '+18%' },
                { day: 'Wednesday', volume: '$38,920', growth: '-8%' },
                { day: 'Thursday', volume: '$61,340', growth: '+25%' },
                { day: 'Friday', volume: '$72,580', growth: '+35%' },
                { day: 'Saturday', volume: '$41,260', growth: '+5%' },
                { day: 'Sunday', volume: '$33,150', growth: '-12%' }
              ].map((day, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{day.day}</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{day.volume}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      day.growth.startsWith('+') ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {day.growth}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-600" />
              <span>Top Performing Assets</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { asset: 'Bitcoin (BTC)', price: '$43,250', change: '+5.2%', volume: '$2.4M' },
                { asset: 'Ethereum (ETH)', price: '$2,840', change: '+3.8%', volume: '$1.8M' },
                { asset: 'Solana (SOL)', price: '$98.50', change: '+12.4%', volume: '$890K' },
                { asset: 'Apple (AAPL)', price: '$182.40', change: '+2.1%', volume: '$1.2M' },
                { asset: 'Tesla (TSLA)', price: '$248.80', change: '-1.5%', volume: '$950K' }
              ].map((asset, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{asset.asset}</p>
                    <p className="text-sm text-gray-500">Vol: {asset.volume}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{asset.price}</p>
                    <p className={`text-sm ${
                      asset.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {asset.change}
                    </p>
                  </div>
                </div>
              ))}
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



  const renderSection = () => {
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
      case 'system':
        return renderSystemStatus();
      default:
        return renderOverview();
    }
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
            <Card className="shadow-sm border-0">
              <CardContent className="p-4">
                <ScrollArea className="w-full">
                  <div className="flex space-x-2 pb-2">
                    {menuItems.map((item) => (
                      <Button
                        key={item.id}
                        variant={activeSection === item.id ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setActiveSection(item.id)}
                        className="flex-shrink-0"
                      >
                        <item.icon className="h-4 w-4 mr-1" />
                        <span className="text-xs">{item.label}</span>
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Desktop Sidebar Navigation */}
          <div className="hidden lg:block lg:w-64 flex-shrink-0">
            <Card className="shadow-lg border-0 sticky top-8">
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-200px)]">
                  <div className="p-4 space-y-2">
                    {menuItems.map((item) => (
                      <motion.button
                        key={item.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveSection(item.id)}
                        className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-all ${
                          activeSection === item.id
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <item.icon className={`h-5 w-5 ${activeSection === item.id ? item.color : 'text-gray-400'}`} />
                        <span className="font-medium">{item.label}</span>
                        {activeSection === item.id && (
                          <ChevronRight className="h-4 w-4 ml-auto text-blue-600" />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </ScrollArea>
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