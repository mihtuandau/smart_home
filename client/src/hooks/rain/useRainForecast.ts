import { useQuery } from '@tanstack/react-query';
import { rainForecastService } from '@/services/rain-forecast.service';
import { rainForecastKeys } from './rainForecastKeys';

/**
 * Hook để lấy dự báo mưa tối ưu hóa 48 giờ
 */
export const useRainForecast = (lat?: number, lon?: number, enabled: boolean = true, refetchInterval?: number) => {
  return useQuery({
    queryKey: rainForecastKeys.list(lat, lon),
    queryFn: () => rainForecastService.getRainForecast(lat, lon),
    enabled,
    refetchInterval: refetchInterval || 5 * 1000, // Refetch every 5 seconds (real-time)
    staleTime: 4 * 1000, // Stale after 4 seconds
  });
};

/**
 * Hook để lấy xác suất mưa hiệu chỉnh gần nhất
 */
export const useRainProbability = (lat?: number, lon?: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: rainForecastKeys.probability(lat, lon),
    queryFn: () => rainForecastService.getLatestRainProbability(lat, lon),
    enabled,
    refetchInterval: 5 * 1000, // Refetch every 5 seconds (real-time)
    staleTime: 4 * 1000,
  });
};

/**
 * Hook để lấy dự báo mưa giờ tiếp theo
 */
export const useNextHourRainForecast = (lat?: number, lon?: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: rainForecastKeys.next(lat, lon),
    queryFn: () => rainForecastService.getNextHourForecast(lat, lon),
    enabled,
    refetchInterval: 5 * 1000, // Refetch every 5 seconds (real-time)
    staleTime: 4 * 1000,
  });
};
