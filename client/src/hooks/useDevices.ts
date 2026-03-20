import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  const socketListenerRef = useRef<((data: any) => void) | null>(null);
  const aiListenerRef = useRef<((data: any) => void) | null>(null);

  const query = useQuery({
    queryKey: deviceKeys.stats(),
    queryFn: deviceService.getDeviceStats,
    enabled: isAuthenticated,
  });

  // Add real-time socket listeners for device status updates
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const handleDeviceStatus = (statusData: any) => {
      queryClient.setQueryData(deviceKeys.stats(), (oldData: any) => {
        if (!oldData) {
          return { data: statusData };
        }

        // Merge socket data with existing cache
        const merged = { ...oldData };
        const dataObj = merged.data || merged;
        
        // Update device counts from socket
        if (statusData.online !== undefined) {
          dataObj.online = statusData.online;
        }
        if (statusData.total !== undefined) {
          dataObj.total = statusData.total;
        }
        
        return merged;
      });
    };

    // Handle AI advice to detect LED state changes (indicates active devices)
    const handleAiAdvice = (aiData: any) => {
      // AI advice includes led1 and led2 status, indicating device activity
      queryClient.setQueryData(deviceKeys.stats(), (oldData: any) => {
        if (!oldData) {
          return oldData;
        }

        // Count active LEDs
        const activeLeds = (aiData.led1 ? 1 : 0) + (aiData.led2 ? 1 : 0);
        
        // Update online count if we have LED data
        const merged = { ...oldData };
        const dataObj = merged.data || merged;
        
        // Conservative update: don't change total, just ensure online reflects current activity
        if (activeLeds > 0) {
          dataObj.online = Math.max(dataObj.online || 0, activeLeds);
        }
        
        return merged;
      });
    };

    socketListenerRef.current = handleDeviceStatus;
    aiListenerRef.current = handleAiAdvice;
    
    socketService.onDeviceStatus(handleDeviceStatus);
    socketService.onAiAdvice(handleAiAdvice);

    // Cleanup listeners on unmount
    return () => {
      if (socketListenerRef.current) {
        socketService.offDeviceStatus(socketListenerRef.current);
        socketListenerRef.current = null;
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
    onSuccess: async () => {
      // Invalidate and refetch immediately
      await queryClient.invalidateQueries({ queryKey: deviceKeys.latestData(), refetchType: 'all' });
      await queryClient.invalidateQueries({ queryKey: deviceKeys.lists(), refetchType: 'all' });
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

      // Return context for rollback if error
      return { previousData };
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
      // Don't invalidateQueries - it causes UI flash
    },

    // Rollback on error
    onError: (error, variables, context: any) => {
      if (context?.previousData) {
        queryClient.setQueryData(deviceKeys.latestData(), context.previousData);
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
