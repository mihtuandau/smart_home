import { apiClient } from './client';

export const settingsApi = {
  async getSettings() {
    return apiClient.request('/settings');
  },

  async updateSettings(data: Record<string, unknown>) {
    return apiClient.request('/settings', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async resetToDefaults() {
    return apiClient.request('/settings/reset', { method: 'POST' });
  },

  async toggleAutoLight() {
    return apiClient.request('/settings/toggle/auto-light', { method: 'POST' });
  },

  async toggleRainProtection() {
    return apiClient.request('/settings/toggle/rain-protection', { method: 'POST' });
  },

  async togglePowerSave() {
    return apiClient.request('/settings/toggle/power-save', { method: 'POST' });
  },

  async toggleAiLearning() {
    return apiClient.request('/settings/toggle/ai-learning', { method: 'POST' });
  },
};
export default settingsApi;
