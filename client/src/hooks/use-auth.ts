import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { User, LoginData } from "@shared/schema";

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/me"],
    retry: false,
    staleTime: Infinity,
    queryFn: async () => {
      try {
        const response = await fetch("/api/me", {
          credentials: "include",
        });
        
        if (response.status === 401) {
          return null;
        }
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.user;
      } catch (error) {
        console.error("Auth error:", error);
        return null;
      }
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (loginData: LoginData) => {
      const response = await apiRequest("POST", "/api/login", loginData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/me"], data.user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/me"], null);
      queryClient.clear();
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    loginError: loginMutation.error?.message,
    isLoginLoading: loginMutation.isPending,
  };
}
