export interface IoTDevice {
  name: string;
  power: number;
  state: boolean;
  pin?: number;
}

export type ToastType = 'success' | 'error' | 'info';

export interface ToastState {
  message: string;
  type: ToastType;
}

export interface LatestData {
  device1?: IoTDevice;
  device2?: IoTDevice;
  [key: string]: unknown;
}
