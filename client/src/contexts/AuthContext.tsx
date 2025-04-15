import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: number;
  email: string;
  display_name: string | null;
  avatar_path: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refetchUser: () => Promise<User | null>;
  logout: () => Promise<void>;
}

const defaultAuthContext: AuthContextType = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  refetchUser: async () => null,
  logout: async () => {},
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Define query options with proper type handling
  const queryOptions: UseQueryOptions<User, Error, User, string[]> = {
    queryKey: ["/api/auth/me"],
    retry: 3, // Increase retry attempts
    retryDelay: 2000, // Longer delay between retries
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes (reduced frequency)
    staleTime: 2 * 60 * 1000, // Data becomes stale after 2 minutes
    refetchOnReconnect: true, // Refetch when network reconnects
    // Optimistically consider the user logged in if we have cached data
    placeholderData: (previousData) => previousData,
  };

  const {
    data: user,
    isLoading,
    refetch,
  } = useQuery(queryOptions);

  // Set authentication state based on user data
  useEffect(() => {
    if (user) {
      setIsAuthenticated(true);
    } else if (!isLoading) {
      setIsAuthenticated(false);
    }
  }, [user, isLoading]);

  // Refetch user data with improved error handling
  const refetchUser = async (): Promise<User | null> => {
    try {
      // Force invalidation of auth query before refetching
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      
      // Refetch with increased timeout
      const result = await refetch();
      
      // If we got data, update the authentication state
      if (result.data) {
        setIsAuthenticated(true);
      }
      
      return result.data as User || null;
    } catch (error) {
      console.error("Failed to refetch user data:", error);
      
      // Check if we have a network error
      if (error instanceof Error && error.message.includes('network')) {
        // Don't clear authentication state on network errors
        // as this could be temporary
        return user || null;
      }
      
      // For other errors, clear authentication state
      setIsAuthenticated(false);
      return null;
    }
  };

  // Logout user
  const logout = async () => {
    try {
      await apiRequest("/api/auth/logout", {
        method: "POST",
      });

      // Clear query cache
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      await queryClient.resetQueries({ queryKey: ["/api/auth/me"] });
      setIsAuthenticated(false);

      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        isAuthenticated,
        refetchUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}