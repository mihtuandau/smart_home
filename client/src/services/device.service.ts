import { devicesApi, iotApi } from '../lib/api';

export const deviceService = {
  // Get all devices
  getDevices: async () => {
    return devicesApi.getDevices();
  },

  // Get device stats
  getDeviceStats: async () => {
    return devicesApi.getDeviceStats();
  },

  // Get latest IoT data
  getLatestData: async () => {
    return iotApi.getLatestIoTData();
  },

  // Get IoT status
  getStatus: async () => {
    return iotApi.getIoTStatus();
  },

  // Control LED
  controlLED: async (data: { led1?: boolean; led2?: boolean }) => {
    return iotApi.controlLED(data);
  },

  // Control single LED
  controlSingleLED: async (ledNumber: number, state: boolean) => {
    return iotApi.controlLed(ledNumber, state);
  },

  // Control servo motor
  controlServo: async (angle: number) => {
    return iotApi.controlServo(angle);
  },

  // Toggle device
  toggleDevice: async (id: string) => {
    return devicesApi.toggleDevice(id);
  },

  // Update device
  updateDevice: async (id: string, data: any) => {
    return devicesApi.updateDevice(id, data);
  },
};
