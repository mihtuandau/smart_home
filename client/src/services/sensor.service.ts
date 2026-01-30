import apiClient from '../lib/api';

export const sensorService = {
  // Get latest sensors
  getSensors: async (limit: number = 10) => {
    return apiClient.getSensors(limit);
  },

  // Get current sensor data
  getCurrentSensors: async () => {
    return apiClient.getCurrentSensors();
  },

  // Get sensor history
  getSensorHistory: async (hours: number = 24) => {
    return apiClient.getSensorHistory(hours);
  },

  // Get sensor stats
  getSensorStats: async () => {
    return apiClient.getSensorStats();
  },

  // Get sensor chart data
  getSensorChart: async (type: string) => {
    return apiClient.getSensorChart(type);
  },

  // Get IoT sensors
  getIoTSensors: async () => {
    return apiClient.getIoTSensors();
  },
};
