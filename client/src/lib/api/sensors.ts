import { apiClient } from './client';

export const sensorsApi = {
  async getSensors(limit: number = 10) {
    return apiClient.request(`/sensors/latest?limit=${limit}`);
  },

  async getCurrentSensors() {
    return apiClient.request('/sensors/current');
  },

  async getSensorHistory(hours: number = 24) {
    return apiClient.request(`/sensors/history/${hours}`);
  },

  async getSensorStats() {
    return apiClient.request('/sensors/stats');
  },

  async getSensorChart(type: string) {
    return apiClient.request(`/sensors/chart/${type}`);
  },
};
