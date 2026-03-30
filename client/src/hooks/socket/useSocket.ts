import { useEffect, useState, useCallback, useRef } from 'react';
import { socketService } from '@/lib/socket';
import type { AiAdvicePayload } from './socketTypes';

interface UseSocketOptions {
  autoConnect?: boolean;
  token?: string;
}

function isAiAdvicePayload(value: unknown): value is AiAdvicePayload {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.time === 'string' &&
    Array.isArray(obj.advice) &&
    typeof obj.analysis === 'string' &&
    (obj.type === 'status' || obj.type === 'alert')
  );
}

export function useSocket(options: UseSocketOptions = {}) {
  const { autoConnect = true, token } = options;
  const [isConnected, setIsConnected] = useState(() => socketService.getSocket()?.connected ?? false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    if (autoConnect) {
      const socket = socketService.connect(token);

      const handleConnect = () => {
        if (mountedRef.current) {
          setIsConnected(true);
          setError(null);
        }
      };

      const handleDisconnect = () => {
        if (mountedRef.current) {
          setIsConnected(false);
        }
      };

      const handleError = (err: unknown) => {
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : 'Socket error');
        }
      };

      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);
      socket.on('connect_error', handleError);

      return () => {
        mountedRef.current = false;
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
        socket.off('connect_error', handleError);
      };
    }

    return () => {
      mountedRef.current = false;
    };
  }, [autoConnect, token]);

  const connect = useCallback(() => {
    socketService.connect(token);
  }, [token]);

  const disconnect = useCallback(() => {
    socketService.disconnect();
  }, []);

  return {
    isConnected,
    error,
    connect,
    disconnect,
    socket: socketService.getSocket(),
  };
}

export function useIoTData() {
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleData = (newData: unknown) => {
      setData(newData);
      setLoading(false);
    };

    socketService.onIoTData(handleData);

    socketService.requestIoTData();

    return () => {
      socketService.offIoTData(handleData);
    };
  }, []);

  return { data, loading };
}

export function useSystemAlerts() {
  const [alerts, setAlerts] = useState<unknown[]>([]);

  useEffect(() => {
    const handleAlert = (alert: unknown) => {
      setAlerts((prev) => [alert, ...prev].slice(0, 50));
    };

    socketService.onSystemAlert(handleAlert);

    return () => {
      socketService.getSocket()?.off('system:alert', handleAlert);
    };
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  return { alerts, clearAlerts };
}

export function useDeviceControl() {
  const controlLED = useCallback((data: { led1?: boolean; led2?: boolean }) => {
    socketService.controlLED(data);
  }, []);

  const controlServo = useCallback((angle: number) => {
    socketService.controlServo(angle);
  }, []);

  return {
    controlLED,
    controlServo,
  };
}

export function useAiAdvice(maxItems = 20) {
  const [status, setStatus] = useState<AiAdvicePayload | null>(null);
  const [alerts, setAlerts] = useState<AiAdvicePayload[]>([]);

  useEffect(() => {
    const handleAdvice = (payload: unknown) => {
      if (!isAiAdvicePayload(payload)) return;
      setStatus(payload);
      if (payload.type === 'alert') {
        setAlerts((prev) => [payload, ...prev].slice(0, maxItems));
      }
    };

    socketService.onAiAdvice(handleAdvice);

    return () => {
      socketService.offAiAdvice(handleAdvice);
    };
  }, [maxItems]);

  const clear = useCallback(() => setAlerts([]), []);

  return { status, alerts, clear };
}

export function useAutomationEvents() {
  const [events, setEvents] = useState<unknown[]>([]);

  useEffect(() => {
    const handleTriggered = (event: unknown) => {
      setEvents((prev) => [event, ...prev].slice(0, 100));
    };

    socketService.onAutomationTriggered(handleTriggered);

    return () => {
      socketService.getSocket()?.off('automation:triggered', handleTriggered);
    };
  }, []);

  return { events };
}
