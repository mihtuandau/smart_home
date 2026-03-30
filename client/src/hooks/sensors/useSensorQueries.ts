import { useQuery } from '@tanstack/react-query';
import { sensorService } from '../../services/sensor.service';
import { QUERY_CONFIG } from '@/config';
import { sensorKeys } from './sensorKeys';

export const useSensorHistory = (hours: number = 24, page: number = 1, pageSize: number = 20) => {
  return useQuery({
    queryKey: sensorKeys.history(hours, page, pageSize),
    queryFn: () => sensorService.getSensorHistory(hours, page, pageSize),
    staleTime: QUERY_CONFIG.STALE_TIME.SENSORS,
    enabled: true,
  });
};

export const useSensorStats = () => {
  return useQuery({
    queryKey: sensorKeys.stats(),
    queryFn: sensorService.getSensorStats,
    staleTime: QUERY_CONFIG.STALE_TIME.DEFAULT,
    enabled: true,
  });
};

export const useSensorChart = (type: string) => {
  return useQuery({
    queryKey: sensorKeys.chart(type),
    queryFn: () => sensorService.getSensorChart(type),
    enabled: !!type,
    staleTime: QUERY_CONFIG.STALE_TIME.SENSORS,
  });
};

export const useIoTSensors = (refetchInterval?: number) => {
  return useQuery({
    queryKey: sensorKeys.iot(),
    queryFn: sensorService.getIoTSensors,
    enabled: true,
    refetchInterval: refetchInterval || QUERY_CONFIG.REFETCH_INTERVAL.SENSORS,
  });
};
