import { useQuery } from '@tanstack/react-query';
import { energyService } from '@/services/energy.service';
import { useAuth } from '@/contexts/AuthContext';

// Query keys
export const energyKeys = {
  all: ['energy'] as const,
  stats: (hours: number) => [...energyKeys.all, 'stats', hours] as const,
  battery: () => [...energyKeys.all, 'battery'] as const,
  solar: (hours: number) => [...energyKeys.all, 'solar', hours] as const,
  sources: (hours: number) => [...energyKeys.all, 'sources', hours] as const,
  efficiency: (hours: number) => [...energyKeys.all, 'efficiency', hours] as const,
};

// Get energy stats
export const useEnergyStats = (hours: number = 24, refetchInterval?: number) => {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: energyKeys.stats(hours),
    queryFn: () => energyService.getEnergyStats(hours),
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 5,
    enabled: isAuthenticated,
    refetchInterval: refetchInterval || 10000, // Refetch every 10 seconds by default
    retry: 1,
  });
};

// Get battery status
export const useBatteryStatus = (refetchInterval?: number) => {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: energyKeys.battery(),
    queryFn: energyService.getBatteryStatus,
    enabled: isAuthenticated,
    refetchInterval: refetchInterval || 10000, // Refetch every 10 seconds
    gcTime: 1000 * 60 * 5,
    retry: 1,
  });
};

// Get solar power stats
export const useSolarStats = (hours: number = 24) => {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: energyKeys.solar(hours),
    queryFn: () => energyService.getSolarStats(hours),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
    enabled: isAuthenticated,
    retry: 1,
  });
};

// Get power sources breakdown
export const usePowerSources = (hours: number = 24) => {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: energyKeys.sources(hours),
    queryFn: () => energyService.getPowerSources(hours),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
    enabled: isAuthenticated,
    retry: 1,
  });
};

// Get efficiency metrics
export const useEfficiencyMetrics = (hours: number = 24) => {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: energyKeys.efficiency(hours),
    queryFn: () => energyService.getEfficiency(hours),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    enabled: isAuthenticated,
    retry: 1,
  });
};
