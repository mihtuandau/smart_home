import { devicesApi, iotApi } from '../lib/api';

export const deviceService = {
  getDevices: async () => {
    return devicesApi.getDevices();
  },

  getDeviceStats: async () => {
    return devicesApi.getDeviceStats();
  },

  getLatestData: async () => {
    return iotApi.getLatestIoTData();
  },

  getStatus: async () => {
    return iotApi.getIoTStatus();
  },

  controlLED: async (data: { led1?: boolean; led2?: boolean }) => {
    return iotApi.controlLED(data);
  },

  controlSingleLED: async (ledNumber: number, state: boolean) => {
    return iotApi.controlLedSingle(ledNumber, state);
  },

  controlServo: async (angle: number) => {
    return iotApi.controlServo(angle);
  },

  toggleDevice: async (id: string) => {
    return devicesApi.toggleDevice(id);
  },

  updateDevice: async (id: string, data: any) => {
    return devicesApi.updateDevice(id, data);
  },
};
