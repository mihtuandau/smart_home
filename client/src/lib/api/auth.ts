import { apiClient } from './client';
import { API_ENDPOINTS } from '@/config';
import type { User } from '@/types';

export const authApi = {
  async login(email: string, password: string) {
    const data = await apiClient.request<{ accessToken: string; user: User }>(
      API_ENDPOINTS.LOGIN,
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
    return data;
  },

  async register(username: string, email: string, password: string) {
    return apiClient.request(API_ENDPOINTS.REGISTER, {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
  },

  async getProfile() {
    return apiClient.request(API_ENDPOINTS.PROFILE);
  },

  async logout() {
    try {
      await apiClient.request(API_ENDPOINTS.LOGOUT, { method: 'POST' });
    } finally {
      apiClient.clearToken();
    }
  },
};

export default authApi;
