import { AuthResponse, LoginCredentials, User } from '../types';
import { authApi } from '../lib/api';

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await authApi.login(credentials.email, credentials.password);
    this.saveAuthData();
    return response;
  }

  async getProfile(): Promise<User> {
    return authApi.getProfile() as Promise<User>;
  }

  async logout() {
    try {
      await authApi.logout();
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        localStorage.removeItem('auth_token');
      }
    }
  }

  saveAuthData() {
    if (typeof window !== 'undefined') {
      // We no longer save any auth data to localStorage for security and privacy
      localStorage.removeItem('user');
      localStorage.removeItem('auth_token');
    }
  }

  getStoredUser(): User | null {
    return null;
  }

  // These methods are kept for backward compatibility with existing code calling them
  // but they no longer do anything since we use HttpOnly cookies.
  setToken() {}
  clearToken() {}

  // No-op for HttpOnly cookies
  setTokenOnClient(): void {}
}

export const authService = new AuthService();
