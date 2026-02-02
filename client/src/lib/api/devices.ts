import { apiClient } from './client';

export const devicesApi = {
  async getDevices() {
    return apiClient.request('/devices');
  },

  async getDeviceStats() {
    return apiClient.request('/devices/stats');
  },

  async getDevicesByType(type: string) {
    return apiClient.request(`/devices/type/${type}`);
  },

  async getDevice(id: string) {
    return apiClient.request(`/devices/${id}`);
  },

  async updateDevice(id: string, data: any) {
    return apiClient.request(`/devices/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async toggleDevice(id: string) {
    return apiClient.request(`/devices/${id}/toggle`, {
      method: 'POST',
    });
  },

  async getDeviceHistory(id: string) {
    return apiClient.request(`/devices/${id}/history`);
  },
};
