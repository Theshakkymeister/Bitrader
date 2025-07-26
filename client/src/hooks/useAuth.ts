import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  console.log("useAuth:", { user, isLoading, error });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
