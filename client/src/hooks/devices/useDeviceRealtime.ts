import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { deviceService } from "../../services/device.service";
import { useAuth } from "../../contexts/AuthContext";
import { socketService } from "@/lib/socket";
import { QUERY_CONFIG } from "@/config";
import { deviceKeys } from "./deviceKeys";
import {
  applyAiAdviceToStats,
  getStatsPatchFromIoT,
  mergeLatestCacheFromAi,
  mergeLatestCacheFromIoT,
  mergeStatsCache,
} from "./deviceMapper";

export const useDeviceStats = () => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const iotListenerRef = useRef<((data: unknown) => void) | null>(null);
  const aiListenerRef = useRef<((data: unknown) => void) | null>(null);

  const query = useQuery({
    queryKey: deviceKeys.stats(),
    queryFn: deviceService.getDeviceStats,
    enabled: true,
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const handleIoTData = (iotData: unknown) => {
      const statsPatch = getStatsPatchFromIoT(iotData);
      if (!statsPatch) return;

      queryClient.setQueryData(deviceKeys.stats(), (oldData: unknown) =>
        mergeStatsCache(oldData, statsPatch),
      );
    };

    const handleAiAdvice = (aiData: unknown) => {
      queryClient.setQueryData(deviceKeys.stats(), (oldData: unknown) =>
        applyAiAdviceToStats(oldData, aiData),
      );
    };

    iotListenerRef.current = handleIoTData;
    aiListenerRef.current = handleAiAdvice;

    socketService.onIoTData(handleIoTData);
    socketService.onAiAdvice(handleAiAdvice);

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

export const useLatestDeviceData = (refetchInterval?: number) => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const iotListenerRef = useRef<((data: unknown) => void) | null>(null);
  const aiListenerRef = useRef<((data: unknown) => void) | null>(null);

  const query = useQuery({
    queryKey: deviceKeys.latestData(),
    queryFn: deviceService.getLatestData,
    enabled: true,
    refetchInterval: refetchInterval ?? QUERY_CONFIG.REFETCH_INTERVAL.DEVICES,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const handleIoTData = (socketData: unknown) => {
      queryClient.setQueryData(deviceKeys.latestData(), (oldData: unknown) =>
        mergeLatestCacheFromIoT(oldData, socketData),
      );
    };

    const handleAiAdvice = (aiData: unknown) => {
      queryClient.setQueryData(deviceKeys.latestData(), (oldData: unknown) =>
        mergeLatestCacheFromAi(oldData, aiData),
      );
    };

    iotListenerRef.current = handleIoTData;
    aiListenerRef.current = handleAiAdvice;

    socketService.onIoTData(handleIoTData);
    socketService.onAiAdvice(handleAiAdvice);

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
