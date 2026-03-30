import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deviceService } from '../../services/device.service';
import { deviceKeys } from './deviceKeys';
import {
  MutationContext,
  syncStatsFromLatestCache,
  toLatestCache,
  toRecord,
} from './deviceMapper';

export const useControlLED = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { led1?: boolean; led2?: boolean }) =>
      deviceService.controlLED(data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: deviceKeys.latestData() });

      const previousLatest = queryClient.getQueryData(deviceKeys.latestData());
      const previousStats = queryClient.getQueryData(deviceKeys.stats());

      queryClient.setQueryData(deviceKeys.latestData(), (old: unknown) => {
        if (!old) return old;
        const updated = toLatestCache(old);
        const dataObj = toRecord(updated.data);
        if (data.led1 !== undefined) dataObj.led1 = data.led1;
        if (data.led2 !== undefined) dataObj.led2 = data.led2;
        updated.data = dataObj;
        return updated;
      });

      syncStatsFromLatestCache(queryClient, deviceKeys.latestData(), deviceKeys.stats());
      return { previousLatest, previousStats };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: deviceKeys.latestData(), refetchType: 'all' });
      await queryClient.invalidateQueries({ queryKey: deviceKeys.lists(), refetchType: 'all' });
      syncStatsFromLatestCache(queryClient, deviceKeys.latestData(), deviceKeys.stats());
    },
    onError: (_error, _variables, context: MutationContext | undefined) => {
      if (context?.previousLatest) {
        queryClient.setQueryData(deviceKeys.latestData(), context.previousLatest);
      }
      if (context?.previousStats) {
        queryClient.setQueryData(deviceKeys.stats(), context.previousStats);
      }
    },
  });
};

export const useControlSingleLED = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ledNumber, state }: { ledNumber: number; state: boolean }) =>
      deviceService.controlSingleLED(ledNumber, state),

    onMutate: async ({ ledNumber, state }) => {
      await queryClient.cancelQueries({ queryKey: deviceKeys.latestData() });

      const previousData = queryClient.getQueryData(deviceKeys.latestData());

      queryClient.setQueryData(deviceKeys.latestData(), (old: unknown) => {
        if (!old) return old;
        const updatedData = toLatestCache(old);
        const dataObj = toRecord(updatedData.data);

        if (ledNumber === 1) {
          dataObj.led1 = state;
        } else if (ledNumber === 2) {
          dataObj.led2 = state;
        }

        updatedData.data = dataObj;
        return updatedData;
      });

      syncStatsFromLatestCache(queryClient, deviceKeys.latestData(), deviceKeys.stats());

      const previousStats = queryClient.getQueryData(deviceKeys.stats());
      return { previousData, previousStats };
    },

    onSuccess: (response: unknown) => {
      const normalizedResponse = toLatestCache(response);

      if (normalizedResponse.data && Object.keys(normalizedResponse.data).length > 0) {
        queryClient.setQueryData(deviceKeys.latestData(), (oldData: unknown) => {
          if (!oldData) return response;

          const merged = toLatestCache(oldData);
          const dataObj = toRecord(merged.data);
          const responseData = toRecord(normalizedResponse.data);

          if (responseData.led1 !== undefined) {
            dataObj.led1 = responseData.led1;
          }
          if (responseData.led2 !== undefined) {
            dataObj.led2 = responseData.led2;
          }

          merged.data = dataObj;
          return merged;
        });
      }
      syncStatsFromLatestCache(queryClient, deviceKeys.latestData(), deviceKeys.stats());
    },

    onError: (_error, _variables, context: MutationContext | undefined) => {
      if (context?.previousData) {
        queryClient.setQueryData(deviceKeys.latestData(), context.previousData);
      }
      if (context?.previousStats) {
        queryClient.setQueryData(deviceKeys.stats(), context.previousStats);
      }
    },
  });
};

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

export const useUpdateDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      deviceService.updateDevice(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: deviceKeys.lists(), refetchType: 'all' });
      await queryClient.invalidateQueries({ queryKey: deviceKeys.latestData(), refetchType: 'all' });
      await queryClient.invalidateQueries({ queryKey: deviceKeys.stats(), refetchType: 'all' });
    },
  });
};
