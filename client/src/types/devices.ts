export enum DeviceType {
  LIGHT = 'LIGHT',
  SWITCH = 'SWITCH',
  THERMOSTAT = 'THERMOSTAT',
  PLUG = 'PLUG',
  LOCK = 'LOCK',
  CAMERA = 'CAMERA',
  SENSOR = 'SENSOR',
  FAN = 'FAN',
  PUMP = 'PUMP',
}

export enum DeviceStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  ON = 'ON',
  OFF = 'OFF',
  IDLE = 'IDLE',
  ERROR = 'ERROR',
}

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  location?: string;
  isOnline: boolean;
  powerConsumption?: number;
  lastUpdate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DeviceStats {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  activeDevices: number;
  totalPowerConsumption: number;
}

export interface DeviceControlRequest {
  id: string;
  action: 'ON' | 'OFF' | 'TOGGLE';
  value?: any;
}

export interface DeviceHistory {
  id: string;
  deviceId: string;
  status: DeviceStatus;
  timestamp: string;
  powerUsage?: number;
}

export interface DeviceUpdate {
  name?: string;
  location?: string;
  status?: DeviceStatus;
}
