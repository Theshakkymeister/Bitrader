import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings as SettingsIcon, 
  Link as LinkIcon, 
  Shield, 
  Bell, 
  Globe, 
  CheckCircle, 
  AlertCircle,
  Eye,
  EyeOff
} from "lucide-react";

export default function Settings() {
  const [isConnected, setIsConnected] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [notifications, setNotifications] = useState({
    trades: true,
    portfolio: true,
    security: true,
    marketing: false
  });
  const { toast } = useToast();

  const handleConnectAccount = async () => {
    if (!apiKey || !apiSecret) {
      toast({
        title: "Missing Credentials",
        description: "Please enter both API Key and Secret",
        variant: "destructive"
      });
      return;
    }

    // Simulate API connection
    try {
      // Here you would make actual API call to Bitraders.net
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsConnected(true);
      toast({
        title: "Account Connected",
        description: "Successfully connected to Bitraders.net",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Bitraders.net. Please check your credentials.",
        variant: "destructive"
      });
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setApiKey("");
    setApiSecret("");
    toast({
      title: "Account Disconnected",
      description: "Successfully disconnected from Bitraders.net",
      variant: "default"
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <SettingsIcon className="h-6 w-6 text-gray-700" />
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      {/* Account Connection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <LinkIcon className="h-5 w-5 text-blue-600" />
              <CardTitle>Bitraders.net Account</CardTitle>
            </div>
            {isConnected ? (
              <Badge variant="default" className="bg-green-100 text-green-700">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-red-100 text-red-700">
                <AlertCircle className="h-3 w-3 mr-1" />
                Not Connected
              </Badge>
            )}
          </div>
          <CardDescription>
            Connect your Bitraders.net account to sync your real trading data and portfolio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isConnected ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <div className="relative">
                  <Input
                    id="apiKey"
                    type={showApiKey ? "text" : "password"}
                    placeholder="Enter your Bitraders.net API Key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="apiSecret">API Secret</Label>
                <Input
                  id="apiSecret"
                  type="password"
                  placeholder="Enter your Bitraders.net API Secret"
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">How to get your API credentials:</p>
                    <ol className="mt-2 space-y-1 text-blue-700 list-decimal list-inside">
                      <li>Log in to your Bitraders.net account</li>
                      <li>Go to Account Settings → API Management</li>
                      <li>Create a new API key with "Read" permissions</li>
                      <li>Copy the API Key and Secret here</li>
                    </ol>
                  </div>
                </div>
              </div>

              <Button onClick={handleConnectAccount} className="w-full">
                Connect Account
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div className="text-sm">
                    <p className="font-medium text-green-900">Account successfully connected</p>
                    <p className="text-green-700">Your portfolio data is now syncing in real-time</p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" onClick={handleDisconnect} className="flex-1">
                  Disconnect Account
                </Button>
                <Button variant="outline" className="flex-1">
                  Test Connection
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-orange-600" />
            <CardTitle>Notifications</CardTitle>
          </div>
          <CardDescription>
            Configure your notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Trade Notifications</Label>
              <p className="text-sm text-gray-500">Get notified when trades are executed</p>
            </div>
            <Switch 
              checked={notifications.trades}
              onCheckedChange={(checked) => setNotifications(prev => ({...prev, trades: checked}))}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Portfolio Updates</Label>
              <p className="text-sm text-gray-500">Daily portfolio performance summaries</p>
            </div>
            <Switch 
              checked={notifications.portfolio}
              onCheckedChange={(checked) => setNotifications(prev => ({...prev, portfolio: checked}))}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Security Alerts</Label>
              <p className="text-sm text-gray-500">Account security and login notifications</p>
            </div>
            <Switch 
              checked={notifications.security}
              onCheckedChange={(checked) => setNotifications(prev => ({...prev, security: checked}))}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Marketing Updates</Label>
              <p className="text-sm text-gray-500">Product updates and promotional offers</p>
            </div>
            <Switch 
              checked={notifications.marketing}
              onCheckedChange={(checked) => setNotifications(prev => ({...prev, marketing: checked}))}
            />
          </div>
        </CardContent>
      </Card>

      {/* App Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Globe className="h-5 w-5 text-purple-600" />
            <CardTitle>App Preferences</CardTitle>
          </div>
          <CardDescription>
            Customize your app experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currency">Default Currency</Label>
            <select 
              id="currency"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="CAD">CAD - Canadian Dollar</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <select 
              id="timezone"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="UTC">UTC</option>
              <option value="EST">EST - Eastern Time</option>
              <option value="PST">PST - Pacific Time</option>
              <option value="GMT">GMT - Greenwich Mean Time</option>
            </select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}