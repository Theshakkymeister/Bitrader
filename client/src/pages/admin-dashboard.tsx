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
  Monitor
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

  // Admin logout
  const logoutMutation = useMutation({
    mutationFn: () => fetch("/api/admin/logout", { method: "POST" }),
    onSuccess: () => {
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out",
        variant: "default"
      });
      window.location.href = "/admin/login";
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

  const renderOverview = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Developer Dashboard</h2>
          <p className="text-gray-600 mt-2">System overview and quick stats</p>
        </div>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
          System Online
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
          <Card className="border-0 shadow-md bg-gradient-to-r from-blue-50 to-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Crypto Addresses</p>
                  <p className="text-2xl font-bold text-blue-900">{cryptoAddresses.length}</p>
                </div>
                <Wallet className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
          <Card className="border-0 shadow-md bg-gradient-to-r from-green-50 to-green-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Website Settings</p>
                  <p className="text-2xl font-bold text-green-900">{websiteSettings.length}</p>
                </div>
                <Settings className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
          <Card className="border-0 shadow-md bg-gradient-to-r from-purple-50 to-purple-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Active Users</p>
                  <p className="text-2xl font-bold text-purple-900">1,247</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
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
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center py-12"
          >
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600">User Management</h3>
            <p className="text-gray-500 mt-2">Coming soon - Advanced user management tools</p>
          </motion.div>
        );
      case 'analytics':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center py-12"
          >
            <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600">Analytics Dashboard</h3>
            <p className="text-gray-500 mt-2">Coming soon - Detailed analytics and reporting</p>
          </motion.div>
        );
      case 'system':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center py-12"
          >
            <Monitor className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600">System Status</h3>
            <p className="text-gray-500 mt-2">Coming soon - Real-time system monitoring</p>
          </motion.div>
        );
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Terminal className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 font-mono">Developer Portal</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
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
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:w-64 flex-shrink-0">
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
    </div>
  );
}