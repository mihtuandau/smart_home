export enum IoTDeviceType {
  LED = 'LED',
  SERVO = 'SERVO',
  MOTOR = 'MOTOR',
  RELAY = 'RELAY',
  BUZZER = 'BUZZER',
}

export interface IoTDevice {
  id: string;
  type: IoTDeviceType;
  name: string;
  pin: number;
  status: 'ON' | 'OFF' | 'ERROR';
  value?: number;
}

export interface IoTStatus {
  devices: IoTDevice[];
  timestamp: string;
  isConnected: boolean;
}

export interface IoTControlRequest {
  type: IoTDeviceType;
  action: 'ON' | 'OFF' | 'SET';
  value?: number;
}

export interface IoTData {
  timestamp: string;
  sensors: Array<{
    name: string;
    value: number;
    unit: string;
  }>;
  devices: IoTDevice[];
}

export interface IoTPower {
  voltage: number;
  current: number;
  power: number;
  frequency: number;
}

export interface IoTLog {
  id: string;
  timestamp: string;
  type: 'INFO' | 'WARNING' | 'ERROR';
  message: string;
  deviceId?: string;
}

export interface LEDControl {
  led1?: boolean;
  led2?: boolean;
  led3?: boolean;
}

export interface ServoControl {
  angle: number;
  speed?: number;
}
