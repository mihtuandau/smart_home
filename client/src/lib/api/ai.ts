import { apiClient } from './client';

export const aiApi = {
  async getStatus() {
    return apiClient.request('/ai/status');
  },

  async getForecast(priceVnd?: number) {
    const query = priceVnd ? `?price=${priceVnd}` : '';
    return apiClient.request(`/ai/forecast${query}`);
  },

  async getBaseline() {
    return apiClient.request('/ai/baseline');
  },

  async getLedDaily(days: number = 7) {
    return apiClient.request(`/ai/led-daily?days=${days}`);
  },
};
