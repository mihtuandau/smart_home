import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboard.service';

// Query keys
export const dashboardKeys = {
  all: ['dashboard'] as const,
  overview: () => [...dashboardKeys.all, 'overview'] as const,
  energy: (hours: number) => [...dashboardKeys.all, 'energy', hours] as const,
  health: () => [...dashboardKeys.all, 'health'] as const,
  activities: (limit: number) => [...dashboardKeys.all, 'activities', limit] as const,
};

// Get dashboard overview
export const useDashboardOverview = () => {
  return useQuery({
    queryKey: dashboardKeys.overview(),
    queryFn: dashboardService.getOverview,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: 1,
  });
};

// Get energy stats
export const useEnergyStats = (hours: number = 24) => {
  return useQuery({
    queryKey: dashboardKeys.energy(hours),
    queryFn: () => dashboardService.getEnergyStats(hours),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10,
    retry: 1,
  });
};

// Get system health
export const useSystemHealth = (refetchInterval?: number) => {
  return useQuery({
    queryKey: dashboardKeys.health(),
    queryFn: dashboardService.getSystemHealth,
    refetchInterval: refetchInterval || 30000, // Refetch every 30 seconds by default
    gcTime: 1000 * 60 * 5,
    retry: 1,
  });
};

// Get recent activities
export const useRecentActivities = (limit: number = 10) => {
  return useQuery({
    queryKey: dashboardKeys.activities(limit),
    queryFn: () => dashboardService.getRecentActivities(limit),
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 3,
    retry: 1,
  });
};
