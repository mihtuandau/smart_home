import { useQuery } from '@tanstack/react-query';
import { deviceService } from '../../services/device.service';
import { QUERY_CONFIG } from '@/config';
import { deviceKeys } from './deviceKeys';

export const useDevices = () => {
  return useQuery({
    queryKey: deviceKeys.lists(),
    queryFn: deviceService.getDevices,
    enabled: true,
  });
};

export const useDeviceStatus = (refetchInterval?: number) => {
  return useQuery({
    queryKey: deviceKeys.status(),
    queryFn: deviceService.getStatus,
    enabled: true,
    refetchInterval: refetchInterval || QUERY_CONFIG.REFETCH_INTERVAL.DEVICES,
  });
};
