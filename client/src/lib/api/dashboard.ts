import { apiClient } from './client';

export const dashboardApi = {
  async getDashboardOverview() {
    return apiClient.request('/dashboard/overview');
  },

  async getEnergyStats(hours: number = 24) {
    return apiClient.request(`/energy/stats?hours=${hours}`);
  },

  async getSystemHealth() {
    return apiClient.request('/dashboard/health');
  },

  async getRecentActivities(limit: number = 10) {
    return apiClient.request(`/dashboard/activities?limit=${limit}`);
  },
};
