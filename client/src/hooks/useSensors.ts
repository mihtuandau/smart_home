import { useQuery } from '@tanstack/react-query';
import { sensorService } from '../services/sensor.service';
import { useAuth } from '../contexts/AuthContext';

// Query keys
export const sensorKeys = {
  all: ['sensors'] as const,
  lists: () => [...sensorKeys.all, 'list'] as const,
  list: (limit: number) => [...sensorKeys.lists(), { limit }] as const,
  current: () => [...sensorKeys.all, 'current'] as const,
  history: (hours: number, page: number, pageSize: number) => [...sensorKeys.all, 'history', hours, page, pageSize] as const,
  stats: () => [...sensorKeys.all, 'stats'] as const,
  chart: (type: string) => [...sensorKeys.all, 'chart', type] as const,
  iot: () => [...sensorKeys.all, 'iot'] as const,
};

// Get latest sensors
export const useSensors = (limit: number = 10, refetchInterval?: number) => {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: sensorKeys.list(limit),
    queryFn: () => sensorService.getSensors(limit),
    enabled: isAuthenticated,
    refetchInterval: refetchInterval || 5000, // Refetch every 5 seconds by default
  });
};

// Get current sensor data
export const useCurrentSensors = (refetchInterval?: number) => {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: sensorKeys.current(),
    queryFn: sensorService.getCurrentSensors,
    enabled: isAuthenticated,
    refetchInterval: refetchInterval || 5000, // Refetch every 5 seconds by default
  });
};

// Get sensor history
export const useSensorHistory = (hours: number = 24, page: number = 1, pageSize: number = 20) => {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: sensorKeys.history(hours, page, pageSize),
    queryFn: () => sensorService.getSensorHistory(hours, page, pageSize),
    staleTime: 1000 * 60 * 2, // 2 minutes
    enabled: isAuthenticated,
  });
};

// Get sensor stats
export const useSensorStats = () => {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: sensorKeys.stats(),
    queryFn: sensorService.getSensorStats,
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: isAuthenticated,
  });
};

// Get sensor chart data
export const useSensorChart = (type: string) => {
  return useQuery({
    queryKey: sensorKeys.chart(type),
    queryFn: () => sensorService.getSensorChart(type),
    enabled: !!type, // Only fetch if type is provided
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Get IoT sensors
export const useIoTSensors = (refetchInterval?: number) => {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: sensorKeys.iot(),
    queryFn: sensorService.getIoTSensors,
    enabled: isAuthenticated,
    refetchInterval: refetchInterval || 5000, // Refetch every 5 seconds by default
  });
};

// Alias for current sensor data
export const useSensorData = useCurrentSensors;
