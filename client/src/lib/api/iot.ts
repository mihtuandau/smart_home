import { apiClient } from './client';

export const iotApi = {

  async controlLED(data: { led1?: boolean; led2?: boolean }) {
    return apiClient.request('/iot/control/led', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async controlLedSingle(ledNumber: number, state: boolean) {
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

  async addIoTDevice(name: string, power_consumption: number) {
    return apiClient.request('/iot/device/add', {
      method: 'POST',
      body: JSON.stringify({ name, power_consumption }),
    });
  },

  async updateIoTDevice(index: number, data: { name?: string; power_consumption?: number }) {
    return apiClient.request(`/iot/device/update/${index}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async controlIoTDevice(data: { device1?: boolean; device2?: boolean }) {
    return apiClient.request('/iot/device/control', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteIoTDevice(index: number) {
    return apiClient.request(`/iot/device/delete/${index}`, {
      method: 'DELETE',
    });
  },
};
