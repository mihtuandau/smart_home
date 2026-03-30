import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { sensorService } from '../../services/sensor.service';
import { useAuth } from '../../contexts/AuthContext';
import { socketService } from '@/lib/socket';
import { QUERY_CONFIG } from '@/config';
import { sensorKeys } from './sensorKeys';
import {
  mergeCurrentSensorsFromAiAdvice,
  mergeCurrentSensorsFromSensorData,
  mergeSensorListFromAiAdvice,
  mergeSensorListFromSensorData,
} from './sensorRealtimeMappers';

export const useSensors = (limit: number = 10, refetchInterval?: number) => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const sensorListenerRef = useRef<((data: unknown) => void) | null>(null);
  const aiListenerRef = useRef<((data: unknown) => void) | null>(null);

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

    const handleSensorUpdate = (sensorData: unknown) => {
      queryClient.setQueryData(sensorKeys.list(limit), (oldData: unknown) =>
        mergeSensorListFromSensorData(oldData, sensorData),
      );
    };

    const handleAiAdvice = (aiData: unknown) => {
      queryClient.setQueryData(sensorKeys.list(limit), (oldData: unknown) =>
        mergeSensorListFromAiAdvice(oldData, aiData),
      );
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
  const sensorListenerRef = useRef<((data: unknown) => void) | null>(null);
  const aiListenerRef = useRef<((data: unknown) => void) | null>(null);

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

    const handleSensorUpdate = (sensorData: unknown) => {
      queryClient.setQueryData(sensorKeys.current(), (oldData: unknown) =>
        mergeCurrentSensorsFromSensorData(oldData, sensorData),
      );
    };

    const handleAiAdvice = (aiData: unknown) => {
      queryClient.setQueryData(sensorKeys.current(), (oldData: unknown) =>
        mergeCurrentSensorsFromAiAdvice(oldData, aiData),
      );
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
