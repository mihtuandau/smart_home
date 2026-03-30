
import { dashboardApi, energyApi } from '../lib/api';

export const dashboardService = {
  getOverview: async () => {
    return dashboardApi.getDashboardOverview();
  },

  getEnergyStats: async (hours: number = 24) => {
    return energyApi.getEnergyStats(hours);
  },

  getSystemHealth: async () => {
    return dashboardApi.getSystemHealth();
  },

  getRecentActivities: async (limit: number = 10) => {
    return dashboardApi.getRecentActivities(limit);
  },
};
