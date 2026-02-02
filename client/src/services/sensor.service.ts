import { sensorsApi, iotApi } from '../lib/api';

export const sensorService = {
  // Get latest sensors
  getSensors: async (limit: number = 10) => {
    return sensorsApi.getSensors(limit);
  },

  // Get current sensor data
  getCurrentSensors: async () => {
    return sensorsApi.getCurrentSensors();
  },

  // Get sensor history
  getSensorHistory: async (hours: number = 24) => {
    return sensorsApi.getSensorHistory(hours);
  },

  // Get sensor stats
  getSensorStats: async () => {
    return sensorsApi.getSensorStats();
  },

  // Get sensor chart data
  getSensorChart: async (type: string) => {
    return sensorsApi.getSensorChart(type);
  },

  // Get IoT sensors
  getIoTSensors: async () => {
    return iotApi.getIoTSensors();
  },
};
