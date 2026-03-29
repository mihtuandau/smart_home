export { apiClient, ApiClient } from './client';
export { authApi } from './auth';
export { dashboardApi } from './dashboard';
export { sensorsApi } from './sensors';
export { devicesApi } from './devices';
export { iotApi } from './iot';
export { automationApi } from './automation';
export { energyApi } from './energy';
export { aiApi } from './ai';
export { settingsApi } from './settings';

import { authApi } from './auth';
import { dashboardApi } from './dashboard';
import { sensorsApi } from './sensors';
import { devicesApi } from './devices';
import { iotApi } from './iot';
import { automationApi } from './automation';
import { energyApi } from './energy';
import { aiApi } from './ai';
import { settingsApi } from './settings';

export const api = {
  auth: authApi,
  dashboard: dashboardApi,
  sensors: sensorsApi,
  devices: devicesApi,
  iot: iotApi,
  automation: automationApi,
  energy: energyApi,
  ai: aiApi,
  settings: settingsApi,
};

export default api;
