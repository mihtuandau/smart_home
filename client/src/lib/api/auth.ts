import { apiClient } from './client';
import { API_ENDPOINTS } from '@/config';

export const authApi = {
  async login(email: string, password: string) {
    const data = await apiClient.request<{ accessToken: string; user: any }>(
      API_ENDPOINTS.LOGIN,
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
    apiClient.setToken(data.accessToken);
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

  clearToken() {
    apiClient.clearToken();
  },
};

export default authApi;
