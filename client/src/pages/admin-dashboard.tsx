import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  EyeOff
} from "lucide-react";
//import { apiRequest } from "@/lib/queryClient";

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

export default function AdminDashboard() {
  const [showAddresses, setShowAddresses] = useState<{[key: string]: boolean}>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current admin user
  const { data: adminUser } = useQuery({
    queryKey: ["/api/admin/user"],
    retry: false,
  });

  // Get crypto addresses
  const { data: cryptoAddresses = [] } = useQuery({
    queryKey: ["/api/admin/crypto-addresses"],
  });

  // Get website settings
  const { data: websiteSettings = [] } = useQuery({
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
      toast({
        title: "Success",
        description: "Setting updated successfully",
        variant: "default"
      });
    },
  });

  const toggleAddressVisibility = (id: string) => {
    setShowAddresses(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const formatAddress = (address: string, show: boolean) => {
    if (!show) return "••••••••••••••••••••••••••••••••••••••••";
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    createAddressMutation.mutate({
      symbol: formData.get("symbol") as string,
      name: formData.get("name") as string,
      address: formData.get("address") as string,
      network: formData.get("network") as string,
    });

    // Reset form
    (e.target as HTMLFormElement).reset();
  };

  if (!adminUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Loading admin dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">Bitrader Admin</h1>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {adminUser.role === 'super_admin' ? 'Super Admin' : 'Admin'}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {adminUser.firstName} {adminUser.lastName}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="addresses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="addresses">
              <Wallet className="h-4 w-4 mr-2" />
              Crypto Addresses
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Website Settings
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="logs">
              <Activity className="h-4 w-4 mr-2" />
              Activity Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="addresses" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cryptocurrency Deposit Addresses</CardTitle>
                <CardDescription>
                  Manage deposit addresses for different cryptocurrencies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add new address form */}
                <form onSubmit={handleAddAddress} className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-gray-50">
                  <div className="space-y-2">
                    <Label htmlFor="symbol">Symbol</Label>
                    <Input
                      id="symbol"
                      name="symbol"
                      placeholder="BTC"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Bitcoin"
                      required
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      name="address"
                      placeholder="bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="network">Network</Label>
                    <Input
                      id="network"
                      name="network"
                      placeholder="mainnet"
                      defaultValue="mainnet"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="submit"
                      disabled={createAddressMutation.isPending}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Address
                    </Button>
                  </div>
                </form>

                <Separator />

                {/* Address list */}
                <div className="space-y-4">
                  {cryptoAddresses.map((address: CryptoAddress) => (
                    <div key={address.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold">{address.symbol}</span>
                          <span className="text-gray-600">({address.name})</span>
                          <Badge variant={address.isActive ? "default" : "secondary"}>
                            {address.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                            {formatAddress(address.address, showAddresses[address.id])}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleAddressVisibility(address.id)}
                          >
                            {showAddresses[address.id] ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <div className="text-xs text-gray-500">
                          Network: {address.network} • Created: {new Date(address.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Website Settings</CardTitle>
                <CardDescription>
                  Configure global website settings and parameters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Website settings management coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  View and manage user accounts and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>User management interface coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Activity Logs</CardTitle>
                <CardDescription>
                  Monitor admin activities and system events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Activity logs viewer coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}