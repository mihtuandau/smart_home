import { AuthResponse, LoginCredentials, User } from '../types';
import { authApi } from '../lib/api';

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await authApi.login(credentials.email, credentials.password);
    this.saveAuthData({
      accessToken: response.access_token,
      user: response.user
    });
    return {
      accessToken: response.access_token,
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
