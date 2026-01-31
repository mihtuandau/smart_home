import apiClient from '../lib/api';

export const energyService = {
  // Get energy stats
  getEnergyStats: async (hours: number = 24) => {
    return apiClient.getEnergyStats(hours);
  },

  // Get battery status
  getBatteryStatus: async () => {
    return apiClient.getBatteryStatus();
  },

  // Get solar power stats
  getSolarStats: async (hours: number = 24) => {
    return apiClient.getSolarStats(hours);
  },

  // Get power sources breakdown
  getPowerSources: async (hours: number = 24) => {
    return apiClient.getPowerSources(hours);
  },

  // Get efficiency metrics
  getEfficiency: async (hours: number = 24) => {
    return apiClient.getEfficiency(hours);
  },
};
