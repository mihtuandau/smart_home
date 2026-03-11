import { AuthResponse, LoginCredentials, User } from '../types';
import { authApi } from '../lib/api';
import { apiClient } from '@/lib/api/client';

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await authApi.login(credentials.email, credentials.password);
    this.saveAuthData({
      accessToken: response.accessToken,
      user: response.user
    });
    return {
      accessToken: response.accessToken,
      user: response.user
    };
  }

  async getProfile(): Promise<User> {
    return authApi.getProfile() as Promise<User>;
  }

  logout() {
    authApi.clearToken();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
    }
  }

  saveAuthData(authResponse: AuthResponse) {
    if (typeof window !== 'undefined') {
      if (authResponse.user) {
        localStorage.setItem('user', JSON.stringify(authResponse.user));
      }
      if (authResponse.accessToken) {
        localStorage.setItem('auth_token', authResponse.accessToken);
      }
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

  setTokenOnClient(token: string): void {
    apiClient.setToken(token);
  }
}

export const authService = new AuthService();
