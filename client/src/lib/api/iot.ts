import { apiClient } from './client';

export const iotApi = {
  async controlLED(data: { led1?: boolean; led2?: boolean }) {
    return apiClient.request('/iot/control/led', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async controlLed(ledNumber: number, state: boolean) {
    const data = ledNumber === 1 ? { led1: state } : { led2: state };
    return iotApi.controlLED(data);
  },

  async controlServo(angle: number) {
    return apiClient.request('/iot/control/servo', {
      method: 'POST',
      body: JSON.stringify({ angle }),
    });
  },

  async getIoTStatus() {
    return apiClient.request('/iot/status');
  },

  async getLatestIoTData() {
    return apiClient.request('/iot/data/latest');
  },

  async getIoTSensors() {
    return apiClient.request('/iot/sensors');
  },

  async getIoTPower() {
    return apiClient.request('/iot/power');
  },

  async getIoTDevices() {
    return apiClient.request('/iot/devices');
  },

  async getIoTLogs() {
    return apiClient.request('/iot/logs');
  },
};
