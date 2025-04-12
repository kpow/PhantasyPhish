import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: number;
  email: string;
  display_name: string | null;
  avatar_path: string | null;
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
    retry: false,
    refetchOnWindowFocus: false,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 4 * 60 * 1000, // Data becomes stale after 4 minutes
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

  // Refetch user data
  const refetchUser = async (): Promise<User | null> => {
    try {
      const result = await refetch();
      return result.data as User || null;
    } catch (error) {
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