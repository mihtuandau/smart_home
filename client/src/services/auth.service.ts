import { AuthResponse, LoginCredentials, User } from '../types';
import apiClient from '../lib/api';

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.login(credentials.email, credentials.password);
    return {
      accessToken: response.access_token,
      user: response.user
    };
  }

  async getProfile(): Promise<User> {
    return apiClient.getProfile() as Promise<User>;
  }

  logout() {
    apiClient.clearToken();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
    }
  }

  saveAuthData(authResponse: AuthResponse) {
    if (authResponse.accessToken) {
      apiClient.setToken(authResponse.accessToken);
    }
    if (typeof window !== 'undefined' && authResponse.user) {
      localStorage.setItem('user', JSON.stringify(authResponse.user));
    }
  }

  getStoredUser(): User | null {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  }

  getStoredToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }
}

export const authService = new AuthService();
