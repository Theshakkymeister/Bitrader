import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, ExternalLink, CheckCircle } from "lucide-react";

interface ConnectAccountProps {
  user: any;
  onConnectionSuccess: () => void;
}

export function ConnectAccount({ user, onConnectionSuccess }: ConnectAccountProps) {
  const [apiKey, setApiKey] = useState("");
  const [externalUserId, setExternalUserId] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const connectMutation = useMutation({
    mutationFn: async (data: { apiKey: string; externalUserId: string }) => {
      const response = await fetch('/api/sync/connect', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Connection failed');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Account Connected",
        description: "Successfully connected to your trading account. Data is now syncing.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio'] });
      onConnectionSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to your trading account",
        variant: "destructive",
      });
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/sync/manual', {
        method: 'POST',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Sync failed');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sync Complete",
        description: "Your trading data has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trades'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync trading data",
        variant: "destructive",
      });
    },
  });

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim() || !externalUserId.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both API key and User ID",
        variant: "destructive",
      });
      return;
    }
    connectMutation.mutate({ apiKey: apiKey.trim(), externalUserId: externalUserId.trim() });
  };

  const isConnected = user?.apiKey && user?.externalUserId;

  return (
    <Card className="bg-slate-900 border-slate-700 hover-lift scale-hover slide-in-left">
      <CardHeader>
        <div className="flex items-center gap-3">
          <ExternalLink className="h-6 w-6 text-blue-500 pulse-subtle" />
          <div>
            <CardTitle className="text-xl">Connect Your Trading Account</CardTitle>
            <CardDescription className="text-slate-400">
              Link your Bitraders.net account to view real trading data
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isConnected ? (
          <>
            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-300 mb-2">How to Connect:</h4>
              <ol className="text-sm text-slate-300 space-y-1 list-decimal list-inside">
                <li>Log in to your Bitraders.net account</li>
                <li>Go to Account Settings → API Access</li>
                <li>Generate a new API key</li>
                <li>Copy your User ID from your profile</li>
                <li>Enter both values below</li>
              </ol>
            </div>

            <form onSubmit={handleConnect} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="Enter your Bitraders.net API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="bg-slate-800 border-slate-600 focus:border-blue-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="externalUserId">User ID</Label>
                <Input
                  id="externalUserId"
                  placeholder="Enter your Bitraders.net User ID"
                  value={externalUserId}
                  onChange={(e) => setExternalUserId(e.target.value)}
                  className="bg-slate-800 border-slate-600 focus:border-blue-500"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 hover-lift scale-hover"
                disabled={connectMutation.isPending}
              >
                {connectMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Connect Account"
                )}
              </Button>
            </form>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-green-900/20 border border-green-700/50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-green-300 font-medium">Account Connected</p>
                <p className="text-sm text-slate-400">
                  User ID: {user.externalUserId}
                </p>
                <p className="text-sm text-slate-400">
                  Last sync: {user.lastSyncAt ? new Date(user.lastSyncAt).toLocaleString() : 'Never'}
                </p>
              </div>
            </div>

            <Button 
              onClick={() => syncMutation.mutate()}
              className="w-full bg-green-600 hover:bg-green-700 hover-lift scale-hover"
              disabled={syncMutation.isPending}
            >
              {syncMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                "Sync Data Now"
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}