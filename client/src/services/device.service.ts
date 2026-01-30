import apiClient from '../lib/api';

export const deviceService = {
  // Get all devices
  getDevices: async () => {
    return apiClient.getDevices();
  },

  // Get device stats
  getDeviceStats: async () => {
    return apiClient.getDeviceStats();
  },

  // Get latest IoT data
  getLatestData: async () => {
    return apiClient.getLatestIoTData();
  },

  // Get IoT status
  getStatus: async () => {
    return apiClient.getIoTStatus();
  },

  // Control LED
  controlLED: async (data: { led1?: boolean; led2?: boolean }) => {
    return apiClient.controlLED(data);
  },

  // Control single LED
  controlSingleLED: async (ledNumber: number, state: boolean) => {
    return apiClient.controlLed(ledNumber, state);
  },

  // Control servo motor
  controlServo: async (angle: number) => {
    return apiClient.controlServo(angle);
  },

  // Toggle device
  toggleDevice: async (id: string) => {
    return apiClient.toggleDevice(id);
  },

  // Update device
  updateDevice: async (id: string, data: any) => {
    return apiClient.updateDevice(id, data);
  },
};
