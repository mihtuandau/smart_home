import { useQuery, useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { deviceService } from '../services/device.service';
import { useAuth } from '../contexts/AuthContext';
import { socketService } from '@/lib/socket';
import { QUERY_CONFIG } from '@/config';


// Query keys
export const deviceKeys = {
  all: ['devices'] as const,
  lists: () => [...deviceKeys.all, 'list'] as const,
  list: (filters: string) => [...deviceKeys.lists(), { filters }] as const,
  details: () => [...deviceKeys.all, 'detail'] as const,
  detail: (id: string) => [...deviceKeys.details(), id] as const,
  stats: () => [...deviceKeys.all, 'stats'] as const,
  latestData: () => [...deviceKeys.all, 'latestData'] as const,
  status: () => [...deviceKeys.all, 'status'] as const,
};

const syncStatsFromLatestCache = (queryClient: QueryClient) => {
  const latestCache: any = queryClient.getQueryData(deviceKeys.latestData());
  const latest = latestCache?.data || latestCache;
  if (!latest) return;

  queryClient.setQueryData(deviceKeys.stats(), (oldStats: any) => {
    const base = oldStats ? { ...oldStats } : { data: {} };
    const dataObj = base.data || base;

    const ledsOn = (latest.led1 ? 1 : 0) + (latest.led2 ? 1 : 0);
    const customEntries = [latest.device1, latest.device2];
    const customPresent = customEntries.filter((v) => {
      if (v === undefined || v === null) return false;
      if (typeof v === 'object') {
        const obj = v as any;
        return Boolean(obj.name) || obj.state !== undefined || obj.power !== undefined;
      }
      return true;
    }).length;
    const customOn = customEntries.filter((v) => {
      if (v === true) return true;
      if (v && typeof v === 'object') {
        return (v as any).state === true;
      }
      return false;
    }).length;

    const total = Math.max(2, 2 + customPresent);
    const online = Math.max(0, Math.min(total, ledsOn + customOn));

    dataObj.total = total;
    dataObj.online = online;
    dataObj.offline = total - online;

    return base;
  });
};

// Get all devices
export const useDevices = () => {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: deviceKeys.lists(),
    queryFn: deviceService.getDevices,
    enabled: isAuthenticated,
  });
};

// Get device stats with real-time socket updates
export const useDeviceStats = () => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const iotListenerRef = useRef<((data: any) => void) | null>(null);
  const aiListenerRef = useRef<((data: any) => void) | null>(null);

  const query = useQuery({
    queryKey: deviceKeys.stats(),
    queryFn: deviceService.getDeviceStats,
    enabled: isAuthenticated,
    // Avoid periodic API overwrite (causes 0/2 flicker); rely on realtime sockets + explicit invalidation
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  // Add real-time socket listeners for device status updates
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const mergeStats = (statusData: any) => {
      if (!statusData) return;

      queryClient.setQueryData(deviceKeys.stats(), (oldData: any) => {
        if (!oldData) {
          return { data: statusData };
        }

        const merged = { ...oldData };
        const dataObj = merged.data || merged;

        // Prevent transient drops to 0 when previous online > 0 and totals unchanged
        if (statusData.online !== undefined) {
          const incomingOnline = statusData.online;
          const incomingTotal = statusData.total ?? dataObj.total;
          const shouldIgnoreDrop =
            dataObj.online !== undefined &&
            dataObj.online > 0 &&
            incomingOnline === 0 &&
            incomingTotal !== undefined &&
            incomingTotal === dataObj.total;

          if (!shouldIgnoreDrop) {
            dataObj.online = incomingOnline;
          }
        }
        if (statusData.total !== undefined) {
          dataObj.total = statusData.total;
        }
        if (statusData.offline !== undefined) {
          dataObj.offline = statusData.offline;
        }

        // Ensure minimum total is 2 (built-in LEDs)
        if (dataObj.total === undefined || dataObj.total < 2) {
          dataObj.total = 2;
        }
        // Clamp online between 0 and total
        if (dataObj.online !== undefined && dataObj.total !== undefined) {
          dataObj.online = Math.max(0, Math.min(dataObj.online, dataObj.total));
          dataObj.offline = dataObj.total - dataObj.online;
        }

        return merged;
      });
    };

    // Handle IoT data socket to update counts including custom devices
    const handleIoTData = (iotData: any) => {
      if (!iotData) return;

      // Ignore payloads that contain only sensor readings (no device states) to avoid flicker
      const hasLedState = iotData.led1 !== undefined || iotData.led2 !== undefined;
      const hasCustomState = iotData.device1 !== undefined || iotData.device2 !== undefined;
      if (!hasLedState && !hasCustomState) return;

      const ledsOn = (iotData.led1 ? 1 : 0) + (iotData.led2 ? 1 : 0);
      const customDevices = [iotData.device1, iotData.device2];
      const customPresent = customDevices.filter((v) => {
        if (v === undefined || v === null) return false;
        if (typeof v === 'object') {
          const obj = v as any;
          return Boolean(obj.name) || obj.state !== undefined || obj.power !== undefined;
        }
        return true;
      }).length;
      const customOn = customDevices.filter((v) => {
        if (v === true) return true;
        if (v && typeof v === 'object') {
          return (v as any).state === true;
        }
        return false;
      }).length;

      const total = 2 + customPresent;
      const online = ledsOn + customOn;

      mergeStats({ online, total, offline: total - online });
    };

    // Fallback realtime from AI event (backend emits this consistently)
    const handleAiAdvice = (aiData: any) => {
      if (!aiData) return;
      if (aiData.led1 === undefined && aiData.led2 === undefined) return;

      const ledsOn = (aiData.led1 ? 1 : 0) + (aiData.led2 ? 1 : 0);

      queryClient.setQueryData(deviceKeys.stats(), (oldData: any) => {
        const base = oldData ? { ...oldData } : { data: {} };
        const dataObj = base.data || base;
        const total = Math.max(2, dataObj.total ?? 2);

        // For LED-only setup (2 devices), AI event is authoritative and instant.
        if (total === 2) {
          dataObj.online = ledsOn;
          dataObj.total = 2;
          dataObj.offline = 2 - ledsOn;
        }

        return base;
      });
    };

    iotListenerRef.current = handleIoTData;
    aiListenerRef.current = handleAiAdvice;

    socketService.onIoTData(handleIoTData);
    socketService.onAiAdvice(handleAiAdvice);

    // Cleanup listeners on unmount
    return () => {
      if (iotListenerRef.current) {
        socketService.offIoTData(iotListenerRef.current);
        iotListenerRef.current = null;
      }
      if (aiListenerRef.current) {
        socketService.offAiAdvice(aiListenerRef.current);
        aiListenerRef.current = null;
      }
    };
  }, [isAuthenticated, queryClient]);

  return query;
};

// Get latest IoT data with real-time socket updates
export const useLatestDeviceData = (refetchInterval?: number) => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const iotListenerRef = useRef<((data: any) => void) | null>(null);
  const aiListenerRef = useRef<((data: any) => void) | null>(null);

  const query = useQuery({
    queryKey: deviceKeys.latestData(),
    queryFn: deviceService.getLatestData,
    enabled: isAuthenticated,
    refetchInterval: refetchInterval ?? QUERY_CONFIG.REFETCH_INTERVAL.DEVICES,
  });

  // Add real-time socket listeners for data updates
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    // Handle IoT data socket events
    const handleIoTData = (socketData: any) => {
      queryClient.setQueryData(deviceKeys.latestData(), (oldData: any) => {
        if (!oldData) {
          return { data: socketData };
        }

        // Merge socket data with existing cache
        const merged = { ...oldData };
        const dataObj = merged.data || merged;
        
        // Update fields from socket (LED status, sensor data, etc.)
        if (socketData.led1 !== undefined) {
          dataObj.led1 = socketData.led1;
        }
        if (socketData.led2 !== undefined) {
          dataObj.led2 = socketData.led2;
        }
        if (socketData.temperature !== undefined) {
          dataObj.temperature = socketData.temperature;
        }
        if (socketData.humidity !== undefined) {
          dataObj.humidity = socketData.humidity;
        }
        if (socketData.voltage !== undefined) {
          dataObj.voltage = socketData.voltage;
        }
        if (socketData.current_mA !== undefined) {
          dataObj.current_mA = socketData.current_mA;
        }
        if (socketData.power !== undefined) {
          dataObj.power = socketData.power;
        }
        
        return merged;
      });
    };

    // Handle AI advice socket events (which include LED status)
    const handleAiAdvice = (aiData: any) => {
      queryClient.setQueryData(deviceKeys.latestData(), (oldData: any) => {
        if (!oldData) {
          return { data: { led1: aiData.led1, led2: aiData.led2 } };
        }

        // Merge AI data with existing cache
        const merged = { ...oldData };
        const dataObj = merged.data || merged;
        
        // Update LED status from AI advice
        if (aiData.led1 !== undefined) {
          dataObj.led1 = aiData.led1;
        }
        if (aiData.led2 !== undefined) {
          dataObj.led2 = aiData.led2;
        }
        
        return merged;
      });
    };

    iotListenerRef.current = handleIoTData;
    aiListenerRef.current = handleAiAdvice;
    
    socketService.onIoTData(handleIoTData);
    socketService.onAiAdvice(handleAiAdvice);

    // Cleanup listeners on unmount
    return () => {
      if (iotListenerRef.current) {
        socketService.offIoTData(iotListenerRef.current);
        iotListenerRef.current = null;
      }
      if (aiListenerRef.current) {
        socketService.offAiAdvice(aiListenerRef.current);
        aiListenerRef.current = null;
      }
    };
  }, [isAuthenticated, queryClient]);

  return query;
};

// Get IoT status
export const useDeviceStatus = (refetchInterval?: number) => {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: deviceKeys.status(),
    queryFn: deviceService.getStatus,
    enabled: isAuthenticated,
    refetchInterval: refetchInterval || QUERY_CONFIG.REFETCH_INTERVAL.DEVICES,
  });
};

// Control LED mutation
export const useControlLED = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { led1?: boolean; led2?: boolean }) =>
      deviceService.controlLED(data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: deviceKeys.latestData() });

      const previousLatest = queryClient.getQueryData(deviceKeys.latestData());
      const previousStats = queryClient.getQueryData(deviceKeys.stats());

      queryClient.setQueryData(deviceKeys.latestData(), (old: any) => {
        if (!old) return old;
        const updated = { ...old };
        const dataObj = updated.data || updated;
        if (data.led1 !== undefined) dataObj.led1 = data.led1;
        if (data.led2 !== undefined) dataObj.led2 = data.led2;
        return updated;
      });

      syncStatsFromLatestCache(queryClient);
      return { previousLatest, previousStats };
    },
    onSuccess: async () => {
      // Invalidate and refetch immediately
      await queryClient.invalidateQueries({ queryKey: deviceKeys.latestData(), refetchType: 'all' });
      await queryClient.invalidateQueries({ queryKey: deviceKeys.lists(), refetchType: 'all' });
      // Do not refetch stats immediately; backend may still be stale for a few seconds.
      syncStatsFromLatestCache(queryClient);
    },
    onError: (_error, _variables, context: any) => {
      if (context?.previousLatest) {
        queryClient.setQueryData(deviceKeys.latestData(), context.previousLatest);
      }
      if (context?.previousStats) {
        queryClient.setQueryData(deviceKeys.stats(), context.previousStats);
      }
    },
  });
};

// Control single LED mutation with optimistic update
export const useControlSingleLED = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ledNumber, state }: { ledNumber: number; state: boolean }) =>
      deviceService.controlSingleLED(ledNumber, state),
    
    // Optimistic update - update UI immediately before server response
    onMutate: async ({ ledNumber, state }) => {
      // Cancel pending queries
      await queryClient.cancelQueries({ queryKey: deviceKeys.latestData() });

      // Get previous data
      const previousData = queryClient.getQueryData(deviceKeys.latestData());

      // Update UI immediately
      queryClient.setQueryData(deviceKeys.latestData(), (old: any) => {
        if (!old) return old;
        const updatedData = { ...old };
        const dataObj = updatedData.data || updatedData;
        
        if (ledNumber === 1) {
          dataObj.led1 = state;
        } else if (ledNumber === 2) {
          dataObj.led2 = state;
        }
        
        return updatedData;
      });

      // Update device stats immediately from optimistic latestData
      syncStatsFromLatestCache(queryClient);

      // Return context for rollback if error
      const previousStats = queryClient.getQueryData(deviceKeys.stats());
      return { previousData, previousStats };
    },

    // Update cache with server response instead of refetching
    onSuccess: (response: any) => {
      // Merge response with existing cache instead of replacing
      if (response?.data) {
        queryClient.setQueryData(deviceKeys.latestData(), (oldData: any) => {
          if (!oldData) return response;
          
          // Merge: keep old data structure, update only the returned fields
          const merged = { ...oldData };
          const dataObj = merged.data || merged;
          const responseData = response.data;
          
          // Only update fields that are in the response
          if (responseData.led1 !== undefined) {
            dataObj.led1 = responseData.led1;
          }
          if (responseData.led2 !== undefined) {
            dataObj.led2 = responseData.led2;
          }
          
          return merged;
        });
      }
      // Keep stats aligned with latestData cache, avoid stale API overwrite
      syncStatsFromLatestCache(queryClient);
    },

    // Rollback on error
    onError: (_error, _variables, context: any) => {
      if (context?.previousData) {
        queryClient.setQueryData(deviceKeys.latestData(), context.previousData);
      }
      if (context?.previousStats) {
        queryClient.setQueryData(deviceKeys.stats(), context.previousStats);
      }
    },
  });
};

// Control servo mutation
export const useControlServo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (angle: number) => deviceService.controlServo(angle),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: deviceKeys.latestData(), refetchType: 'all' });
      await queryClient.invalidateQueries({ queryKey: deviceKeys.lists(), refetchType: 'all' });
      await queryClient.invalidateQueries({ queryKey: deviceKeys.stats(), refetchType: 'all' });
    },
  });
};

// Toggle device mutation
export const useToggleDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deviceService.toggleDevice(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: deviceKeys.lists(), refetchType: 'all' });
      await queryClient.invalidateQueries({ queryKey: deviceKeys.latestData(), refetchType: 'all' });
      await queryClient.invalidateQueries({ queryKey: deviceKeys.stats(), refetchType: 'all' });
    },
  });
};

// Update device mutation
export const useUpdateDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      deviceService.updateDevice(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: deviceKeys.lists(), refetchType: 'all' });
      await queryClient.invalidateQueries({ queryKey: deviceKeys.latestData(), refetchType: 'all' });
      await queryClient.invalidateQueries({ queryKey: deviceKeys.stats(), refetchType: 'all' });
    },
  });
};
