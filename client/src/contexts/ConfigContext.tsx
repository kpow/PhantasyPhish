import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Define the config shape
interface AppConfig {
  testModeEnabled: boolean;
  siteOverlayEnabled: boolean;
}

// Initial default config 
const defaultConfig: AppConfig = {
  testModeEnabled: true,
  siteOverlayEnabled: false
};

// Context type definition
interface ConfigContextType {
  config: AppConfig;
  isLoading: boolean;
  updateConfig: (newConfig: Partial<AppConfig>) => Promise<void>;
}

// Create the context with a default value
const ConfigContext = createContext<ConfigContextType>({
  config: defaultConfig,
  isLoading: true,
  updateConfig: async () => {}
});

// Custom hook to use the config context
export const useConfig = () => useContext(ConfigContext);

interface ConfigProviderProps {
  children: ReactNode;
}

export function ConfigProvider({ children }: ConfigProviderProps) {
  const queryClient = useQueryClient();
  
  // Fetch config from the server
  const { data, isLoading } = useQuery<{ config: AppConfig }>({
    queryKey: ['/api/admin/config']
  });

  // Use the fetched config or default if not available
  const currentConfig: AppConfig = data?.config || defaultConfig;

  // Mutation to update config
  const updateConfigMutation = useMutation({
    mutationFn: async (newConfig: Partial<AppConfig>) => {
      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ config: { ...currentConfig, ...newConfig } }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to update configuration');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate the config query to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/config'] });
    }
  });

  // Function to update config
  const updateConfig = async (newConfig: Partial<AppConfig>) => {
    await updateConfigMutation.mutateAsync(newConfig);
  };

  return (
    <ConfigContext.Provider value={{ 
      config: currentConfig, 
      isLoading: isLoading || updateConfigMutation.isPending,
      updateConfig 
    }}>
      {children}
    </ConfigContext.Provider>
  );
}