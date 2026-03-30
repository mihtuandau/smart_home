import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../../services/dashboard.service';
import { QUERY_CONFIG } from '@/config';
import { dashboardKeys } from './dashboardKeys';

export const useDashboardOverview = () => {
  return useQuery({
    queryKey: dashboardKeys.overview(),
    queryFn: dashboardService.getOverview,
    staleTime: QUERY_CONFIG.STALE_TIME.DASHBOARD,
    gcTime: QUERY_CONFIG.CACHE_TIME,
    enabled: true,
    retry: QUERY_CONFIG.RETRY,
  });
};

export const useEnergyStats = (hours: number = 24) => {
  return useQuery({
    queryKey: dashboardKeys.energy(hours),
    queryFn: () => dashboardService.getEnergyStats(hours),
    staleTime: QUERY_CONFIG.STALE_TIME.ENERGY,
    gcTime: QUERY_CONFIG.CACHE_TIME,
    enabled: true,
    retry: QUERY_CONFIG.RETRY,
  });
};

export const useSystemHealth = (refetchInterval?: number) => {
  return useQuery({
    queryKey: dashboardKeys.health(),
    queryFn: dashboardService.getSystemHealth,
    refetchInterval: refetchInterval || QUERY_CONFIG.REFETCH_INTERVAL.SYSTEM_HEALTH,
    enabled: true,
    gcTime: QUERY_CONFIG.CACHE_TIME,
    retry: QUERY_CONFIG.RETRY,
  });
};

export const useRecentActivities = (limit: number = 10) => {
  return useQuery({
    queryKey: dashboardKeys.activities(limit),
    queryFn: () => dashboardService.getRecentActivities(limit),
    staleTime: QUERY_CONFIG.STALE_TIME.DEFAULT,
    gcTime: QUERY_CONFIG.CACHE_TIME,
    enabled: true,
    retry: QUERY_CONFIG.RETRY,
  });
};
