import { dashboardApi } from '../lib/api';

export const dashboardService = {
  // Get dashboard overview
  getOverview: async () => {
    return dashboardApi.getDashboardOverview();
  },

  // Get energy stats
  getEnergyStats: async (hours: number = 24) => {
    return dashboardApi.getEnergyStats(hours);
  },

  // Get system health
  getSystemHealth: async () => {
    return dashboardApi.getSystemHealth();
  },

  // Get recent activities
  getRecentActivities: async (limit: number = 10) => {
    return dashboardApi.getRecentActivities(limit);
  },
};
