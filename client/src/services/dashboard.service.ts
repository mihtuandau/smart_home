import { dashboardApi, energyApi } from '../lib/api';

export const dashboardService = {
  // Get dashboard overview
  getOverview: async () => {
    return dashboardApi.getDashboardOverview();
  },

  // Get energy stats
  getEnergyStats: async (hours: number = 24) => {
    return energyApi.getEnergyStats(hours);
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
