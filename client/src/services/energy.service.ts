import { energyApi } from "../lib/api";

export const energyService = {
  getEnergyStats: async (hours: number = 24) => {
    return energyApi.getEnergyStats(hours);
  },

  getLatestStatus: async () => {
    return energyApi.getLatestStatus();
  },

  getBatteryStatus: async () => {
    return energyApi.getLatestStatus();
  },

  getSolarStats: async (hours: number = 24) => {
    // Unified energy source - reuse stats
    return energyApi.getEnergyStats(hours);
  },

  getPowerSources: async (hours: number = 24) => {
    // Return empty or single source to prevent 404
    return { success: true, data: [] };
  },

  getEfficiency: async (hours: number = 24) => {
    return energyApi.getEfficiency(hours);
  },

  getEnergySummary: async () => {
    return energyApi.getEnergySummary();
  },
};
