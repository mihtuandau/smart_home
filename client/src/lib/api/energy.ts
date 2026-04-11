import { apiClient } from "./client";

export const energyApi = {
  async getEnergyStats(
    hours: number = 24,
    mode: "auto" | "raw" | "avg" = "auto",
  ) {
    return apiClient.request(`/energy/stats?hours=${hours}&mode=${mode}`);
  },

  async getBatteryStatus() {
    return apiClient.request("/energy/battery");
  },

  async getSolarStats(hours: number = 24) {
    return apiClient.request(`/energy/solar?hours=${hours}`);
  },

  async getPowerSources(hours: number = 24) {
    return apiClient.request(`/energy/sources?hours=${hours}`);
  },

  async getEfficiency(hours: number = 24) {
    return apiClient.request(`/energy/efficiency?hours=${hours}`);
  },

  async getEnergySummary() {
    return apiClient.request("/energy/summary");
  },
};
