import { API_CONFIG, AUTH_CONFIG, API_ENDPOINTS } from '@/config';

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    // Load token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'An error occurred',
      }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth APIs
  async login(email: string, password: string) {
    const data = await this.request<{ access_token: string; user: any }>(
      API_ENDPOINTS.LOGIN,
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
    this.setToken(data.access_token);
    return data;
  }

  async register(username: string, email: string, password: string) {
    return this.request(API_ENDPOINTS.REGISTER, {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
  }

  async getProfile() {
    return this.request(API_ENDPOINTS.PROFILE);
  }

  // Dashboard APIs
  async getDashboardOverview() {
    return this.request('/dashboard/overview');
  }

  async getEnergyStats(hours: number = 24) {
    return this.request(`/dashboard/energy?hours=${hours}`);
  }

  async getSystemHealth() {
    return this.request('/dashboard/health');
  }

  async getRecentActivities(limit: number = 10) {
    return this.request(`/dashboard/activities?limit=${limit}`);
  }

  // Sensors APIs
  async getSensors(limit: number = 10) {
    return this.request(`/sensors/latest?limit=${limit}`);
  }

  async getCurrentSensors() {
    return this.request('/sensors/current');
  }

  async getSensorHistory(hours: number = 24) {
    return this.request(`/sensors/history/${hours}`);
  }

  async getSensorStats() {
    return this.request('/sensors/stats');
  }

  async getSensorChart(type: string) {
    return this.request(`/sensors/chart/${type}`);
  }

  // Devices APIs
  async getDevices() {
    return this.request('/devices');
  }

  async getDeviceStats() {
    return this.request('/devices/stats');
  }

  async getDevicesByType(type: string) {
    return this.request(`/devices/type/${type}`);
  }

  async getDevice(id: string) {
    return this.request(`/devices/${id}`);
  }

  async updateDevice(id: string, data: any) {
    return this.request(`/devices/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async toggleDevice(id: string) {
    return this.request(`/devices/${id}/toggle`, {
      method: 'POST',
    });
  }

  async getDeviceHistory(id: string) {
    return this.request(`/devices/${id}/history`);
  }

  // IoT Control APIs
  async controlLED(data: { led1?: boolean; led2?: boolean }) {
    return this.request('/iot/control/led', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Helper method for individual LED control
  async controlLed(ledNumber: number, state: boolean) {
    const data = ledNumber === 1 ? { led1: state } : { led2: state };
    return this.controlLED(data);
  }

  async controlServo(angle: number) {
    return this.request('/iot/control/servo', {
      method: 'POST',
      body: JSON.stringify({ angle }),
    });
  }

  async getIoTStatus() {
    return this.request('/iot/status');
  }

  async getLatestIoTData() {
    return this.request('/iot/data/latest');
  }

  async getIoTSensors() {
    return this.request('/iot/sensors');
  }

  async getIoTPower() {
    return this.request('/iot/power');
  }

  async getIoTDevices() {
    return this.request('/iot/devices');
  }

  async getIoTLogs() {
    return this.request('/iot/logs');
  }

  // Automation APIs
  async getAutomationRules() {
    return this.request('/automation');
  }

  async getActiveAutomationRules() {
    return this.request('/automation/active');
  }

  async getAutomationRule(id: string) {
    return this.request(`/automation/${id}`);
  }

  async createAutomationRule(data: any) {
    return this.request('/automation', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAutomationRule(id: string, data: any) {
    return this.request(`/automation/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteAutomationRule(id: string) {
    return this.request(`/automation/${id}`, {
      method: 'DELETE',
    });
  }

  async toggleAutomationRule(id: string) {
    return this.request(`/automation/${id}/toggle`, {
      method: 'POST',
    });
  }
}


export const api = new ApiClient();
export default api;
