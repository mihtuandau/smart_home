import { useQuery } from '@tanstack/react-query';
import { aiApi } from '@/lib/api/ai';
import { useAuth } from '@/contexts/AuthContext';
import { billingKeys } from './billingKeys';

export const useBillingForecast = (priceVnd?: number, refetchInterval?: number) => {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: billingKeys.forecast(priceVnd),
    queryFn: () => aiApi.getForecast(priceVnd),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    enabled: isAuthenticated,
    refetchInterval: refetchInterval || 1000 * 60 * 5,
    retry: 1,
  });
};

export const useLedDailyStats = (days: number = 7, refetchInterval?: number) => {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: billingKeys.ledDaily(days),
    queryFn: () => aiApi.getLedDaily(days),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    enabled: isAuthenticated,
    refetchInterval: refetchInterval || 1000 * 60 * 2,
    retry: 1,
  });
};
