import { energyApi } from '../lib/api';

export const energyService = {
  // Get energy stats
  getEnergyStats: async (hours: number = 24) => {
    return energyApi.getEnergyStats(hours);
  },

  // Get battery status
  getBatteryStatus: async () => {
    return energyApi.getBatteryStatus();
  },

  // Get solar power stats
  getSolarStats: async (hours: number = 24) => {
    return energyApi.getSolarStats(hours);
  },

  // Get power sources breakdown
  getPowerSources: async (hours: number = 24) => {
    return energyApi.getPowerSources(hours);
  },

  // Get efficiency metrics
  getEfficiency: async (hours: number = 24) => {
    return energyApi.getEfficiency(hours);
  },
};
