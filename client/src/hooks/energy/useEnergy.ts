import { useQuery } from "@tanstack/react-query";
import { energyService } from "@/services/energy.service";
import { energyKeys } from "./energyKeys";

export const useEnergyStats = (
  hours: number = 24,
  refetchInterval?: number,
) => {
  return useQuery({
    queryKey: energyKeys.stats(hours),
    queryFn: () => energyService.getEnergyStats(hours),
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    enabled: true,
    refetchInterval: refetchInterval || 10000,
    retry: 1,
  });
};

export const useBatteryStatus = (refetchInterval?: number) => {
  return useQuery({
    queryKey: energyKeys.battery(),
    queryFn: energyService.getBatteryStatus,
    enabled: true,
    refetchInterval: refetchInterval || 10000,
    gcTime: 1000 * 60 * 5,
    retry: 1,
  });
};

export const useSolarStats = (hours: number = 24) => {
  return useQuery({
    queryKey: energyKeys.solar(hours),
    queryFn: () => energyService.getSolarStats(hours),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
    enabled: true,
    retry: 1,
  });
};

export const usePowerSources = (hours: number = 24) => {
  return useQuery({
    queryKey: energyKeys.sources(hours),
    queryFn: () => energyService.getPowerSources(hours),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
    enabled: true,
    retry: 1,
  });
};

export const useEfficiencyMetrics = (hours: number = 24) => {
  return useQuery({
    queryKey: energyKeys.efficiency(hours),
    queryFn: () => energyService.getEfficiency(hours),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    enabled: true,
    retry: 1,
  });
};

export const useEnergySummary = () => {
  return useQuery({
    queryKey: energyKeys.summary(),
    queryFn: () => energyService.getEnergySummary(),
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 10000, // 10 seconds
  });
};
