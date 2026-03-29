import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { sensorService } from '../services/sensor.service';
import { useAuth } from '../contexts/AuthContext';
import { socketService } from '@/lib/socket';
import { QUERY_CONFIG } from '@/config';

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

export const useSensors = (limit: number = 10, refetchInterval?: number) => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const sensorListenerRef = useRef<((data: any) => void) | null>(null);
  const aiListenerRef = useRef<((data: any) => void) | null>(null);

  const query = useQuery({
    queryKey: sensorKeys.list(limit),
    queryFn: () => sensorService.getSensors(limit),
    enabled: true,
    refetchInterval: refetchInterval || QUERY_CONFIG.REFETCH_INTERVAL.SENSORS,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const handleSensorUpdate = (sensorData: any) => {
      queryClient.setQueryData(sensorKeys.list(limit), (oldData: any) => {
        if (!oldData) {
          return { data: [sensorData] };
        }

        const merged = { ...oldData };
        const dataArray = merged.data || merged;

        if (Array.isArray(dataArray) && dataArray.length > 0) {
          dataArray[0] = { ...dataArray[0], ...sensorData };
        }

        return merged;
      });
    };

    const handleAiAdvice = (aiData: any) => {
      queryClient.setQueryData(sensorKeys.list(limit), (oldData: any) => {
        if (!oldData) {
          return oldData;
        }

        const merged = { ...oldData };
        const dataArray = merged.data || merged;

        if (Array.isArray(dataArray) && dataArray.length > 0) {
          if (aiData.powerW !== undefined) {
            dataArray[0].power_mW = aiData.powerW * 1000;
          }
          if (aiData.led1 !== undefined) {
            dataArray[0].led1 = aiData.led1;
          }
          if (aiData.led2 !== undefined) {
            dataArray[0].led2 = aiData.led2;
          }
        }

        return merged;
      });
    };

    sensorListenerRef.current = handleSensorUpdate;
    aiListenerRef.current = handleAiAdvice;

    socketService.onSensorUpdate(handleSensorUpdate);
    socketService.onIoTData(handleSensorUpdate);
    socketService.onAiAdvice(handleAiAdvice);

    return () => {
      if (sensorListenerRef.current) {
        socketService.offSensorUpdate(sensorListenerRef.current);
        socketService.offIoTData(sensorListenerRef.current);
        sensorListenerRef.current = null;
      }
      if (aiListenerRef.current) {
        socketService.offAiAdvice(aiListenerRef.current);
        aiListenerRef.current = null;
      }
    };
  }, [isAuthenticated, queryClient, limit]);

  return query;
};

export const useCurrentSensors = (refetchInterval?: number) => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const sensorListenerRef = useRef<((data: any) => void) | null>(null);
  const aiListenerRef = useRef<((data: any) => void) | null>(null);

  const query = useQuery({
    queryKey: sensorKeys.current(),
    queryFn: sensorService.getCurrentSensors,
    enabled: true,
    refetchInterval: refetchInterval || QUERY_CONFIG.REFETCH_INTERVAL.SENSORS,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const handleSensorUpdate = (sensorData: any) => {
      queryClient.setQueryData(sensorKeys.current(), (oldData: any) => {
        if (!oldData) {
          return { data: sensorData };
        }

        const merged = { ...oldData };
        const dataObj = merged.data || merged;

        Object.keys(sensorData).forEach((key) => {
          dataObj[key] = sensorData[key];
        });

        return merged;
      });
    };

    const handleAiAdvice = (aiData: any) => {
      queryClient.setQueryData(sensorKeys.current(), (oldData: any) => {
        if (!oldData) {
          return oldData;
        }

        const merged = { ...oldData };
        const dataObj = merged.data || merged;

        if (aiData.powerW !== undefined) {
          dataObj.power_mW = aiData.powerW * 1000;
        }
        if (aiData.led1 !== undefined) {
          dataObj.led1 = aiData.led1;
        }
        if (aiData.led2 !== undefined) {
          dataObj.led2 = aiData.led2;
        }

        return merged;
      });
    };

    sensorListenerRef.current = handleSensorUpdate;
    aiListenerRef.current = handleAiAdvice;

    socketService.onSensorUpdate(handleSensorUpdate);
    socketService.onIoTData(handleSensorUpdate);
    socketService.onAiAdvice(handleAiAdvice);

    return () => {
      if (sensorListenerRef.current) {
        socketService.offSensorUpdate(sensorListenerRef.current);
        socketService.offIoTData(sensorListenerRef.current);
        sensorListenerRef.current = null;
      }
      if (aiListenerRef.current) {
        socketService.offAiAdvice(aiListenerRef.current);
        aiListenerRef.current = null;
      }
    };
  }, [isAuthenticated, queryClient]);

  return query;
};

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

export const useSensorData = useCurrentSensors;
