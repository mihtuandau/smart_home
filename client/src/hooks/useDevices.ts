import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deviceService } from '../services/device.service';
import { useAuth } from '../contexts/AuthContext';
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

// Get device stats
export const useDeviceStats = () => {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: deviceKeys.stats(),
    queryFn: deviceService.getDeviceStats,
    enabled: isAuthenticated,
  });
};

// Get latest IoT data
export const useLatestDeviceData = (refetchInterval?: number) => {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: deviceKeys.latestData(),
    queryFn: deviceService.getLatestData,
    enabled: isAuthenticated,
    refetchInterval: refetchInterval ?? QUERY_CONFIG.REFETCH_INTERVAL.DEVICES,
  });
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
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: deviceKeys.latestData() });
      queryClient.invalidateQueries({ queryKey: deviceKeys.lists() });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deviceKeys.latestData() });
      queryClient.invalidateQueries({ queryKey: deviceKeys.lists() });
    },
  });
};

// Toggle device mutation
export const useToggleDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deviceService.toggleDevice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deviceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: deviceKeys.latestData() });
    },
  });
};

// Update device mutation
export const useUpdateDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      deviceService.updateDevice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deviceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: deviceKeys.latestData() });
    },
  });
};
