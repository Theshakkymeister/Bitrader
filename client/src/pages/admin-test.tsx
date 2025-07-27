import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminTest() {
  const [loginStatus, setLoginStatus] = useState("Not logged in");

  const { data: adminStats, refetch: refetchStats } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: false,
  });

  const handleLogin = async () => {
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "ken.attwood@yahoo.com",
          password: "AdminPass2025!"
        }),
        credentials: "include"
      });

      if (response.ok) {
        const data = await response.json();
        setLoginStatus(`Logged in as ${data.email}`);
        refetchStats();
      } else {
        setLoginStatus("Login failed");
      }
    } catch (error) {
      setLoginStatus("Login error");
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Admin Authentication Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Status: {loginStatus}</p>
          
          <Button onClick={handleLogin}>
            Login as Admin
          </Button>

          {adminStats && (
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <h3 className="font-semibold">Admin Stats:</h3>
              <pre>{JSON.stringify(adminStats, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}