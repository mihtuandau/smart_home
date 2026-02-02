export enum SensorType {
  TEMPERATURE = 'TEMPERATURE',
  HUMIDITY = 'HUMIDITY',
  LIGHT = 'LIGHT',
  MOTION = 'MOTION',
  PRESSURE = 'PRESSURE',
  CO2 = 'CO2',
  SMOKE = 'SMOKE',
  GAS = 'GAS',
}

export interface SensorReading {
  sensorId: string;
  type: SensorType;
  value: number;
  unit: string;
  timestamp: string;
}

export interface Sensor {
  id: string;
  name: string;
  type: SensorType;
  location?: string;
  value: number;
  unit: string;
  minValue?: number;
  maxValue?: number;
  lastUpdate?: string;
  isActive: boolean;
}

export interface SensorStats {
  average: number;
  min: number;
  max: number;
  current: number;
}

export interface SensorHistoryData {
  value: number;
  timestamp: string;
}

export interface SensorHistory {
  sensorId: string;
  type: SensorType;
  data: SensorHistoryData[];
  stats: SensorStats;
}

export interface SensorChart {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
  }>;
}
