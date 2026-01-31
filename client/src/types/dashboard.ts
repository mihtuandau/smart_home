// Dashboard Types

export interface DashboardOverview {
  totalDevices: number;
  activeDevices: number;
  totalEnergy: number;
  alerts: number;
}

export interface EnergyData {
  time: string;
  consumption: number;
}

export interface EnergyStats {
  totalConsumption: number;
  averageConsumption: number;
  peakConsumption: number;
  history: EnergyData[];
}

export interface SystemHealth {
  cpu: number;
  memory: number;
  uptime: number;
  status: 'healthy' | 'warning' | 'critical';
}

export interface Activity {
  id: string;
  type: string;
  description: string;
  message?: string;
  timestamp: string;
  user?: string;
}

export interface SensorReading {
  temperature: number;
  humidity: number;
  light: number;
  timestamp: string;
}

export interface DeviceStatus {
  id: string;
  name: string;
  type: string;
  status: 'online' | 'offline' | 'on' | 'off';
  lastUpdate?: string;
}

export interface ChartDataPoint {
  time: string;
  value: number;
  label?: string;
}

export interface DashboardStats {
  devices: {
    total: number;
    online: number;
    offline: number;
  };
  energy: {
    current: number;
    today: number;
    month: number;
  };
  sensors: {
    temperature: number;
    humidity: number;
    light: number;
  };
  alerts: {
    total: number;
    critical: number;
    warning: number;
  };
}
