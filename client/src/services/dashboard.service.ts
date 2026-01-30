import apiClient from '../lib/api';

export const dashboardService = {
  // Get dashboard overview
  getOverview: async () => {
    return apiClient.getDashboardOverview();
  },

  // Get energy stats
  getEnergyStats: async (hours: number = 24) => {
    return apiClient.getEnergyStats(hours);
  },

  // Get system health
  getSystemHealth: async () => {
    return apiClient.getSystemHealth();
  },

  // Get recent activities
  getRecentActivities: async (limit: number = 10) => {
    return apiClient.getRecentActivities(limit);
  },
};
