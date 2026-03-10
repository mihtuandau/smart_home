import { apiClient } from './client';

export const sensorsApi = {
  async getSensors(limit: number = 10) {
    return apiClient.request(`/sensors/latest?limit=${limit}`);
  },

  async getCurrentSensors() {
    return apiClient.request('/sensors/current');
  },

  async getSensorHistory(hours: number = 24, page: number = 1, pageSize: number = 20) {
    return apiClient.request(`/sensors/history/${hours}?page=${page}&pageSize=${pageSize}`);
  },

  async getSensorStats(hours: number = 24) {
    return apiClient.request(`/sensors/stats?hours=${hours}`);
  },

  async getSensorChart(type: string) {
    return apiClient.request(`/sensors/chart/${type}`);
  },
};
