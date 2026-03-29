import { sensorsApi, iotApi } from '../lib/api';

export const sensorService = {
  getSensors: async (limit: number = 10) => {
    return sensorsApi.getSensors(limit);
  },

  getCurrentSensors: async () => {
    return sensorsApi.getCurrentSensors();
  },

  getSensorHistory: async (hours: number = 24, page: number = 1, pageSize: number = 20) => {
    return sensorsApi.getSensorHistory(hours, page, pageSize);
  },

  getSensorStats: async () => {
    return sensorsApi.getSensorStats();
  },

  getSensorChart: async (type: string) => {
    return sensorsApi.getSensorChart(type);
  },

  getIoTSensors: async () => {
    return iotApi.getIoTSensors();
  },
};
