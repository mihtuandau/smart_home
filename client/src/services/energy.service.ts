import { energyApi } from "../lib/api";

export const energyService = {
  getEnergyStats: async (hours: number = 24) => {
    return energyApi.getEnergyStats(hours);
  },

  getBatteryStatus: async () => {
    return energyApi.getBatteryStatus();
  },

  getSolarStats: async (hours: number = 24) => {
    return energyApi.getSolarStats(hours);
  },

  getPowerSources: async (hours: number = 24) => {
    return energyApi.getPowerSources(hours);
  },

  getEfficiency: async (hours: number = 24) => {
    return energyApi.getEfficiency(hours);
  },
};
