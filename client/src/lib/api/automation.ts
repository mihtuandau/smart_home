import { apiClient } from './client';

export const automationApi = {
  async getAutomationRules() {
    return apiClient.request('/automation');
  },

  async getActiveAutomationRules() {
    return apiClient.request('/automation/active');
  },

  async getAutomationRule(id: string) {
    return apiClient.request(`/automation/${id}`);
  },

  async createAutomationRule(data: any) {
    return apiClient.request('/automation', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateAutomationRule(id: string, data: any) {
    return apiClient.request(`/automation/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteAutomationRule(id: string) {
    return apiClient.request(`/automation/${id}`, {
      method: 'DELETE',
    });
  },

  async toggleAutomationRule(id: string) {
    return apiClient.request(`/automation/${id}/toggle`, {
      method: 'POST',
    });
  },
};
