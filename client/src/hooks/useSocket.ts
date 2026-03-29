import { useEffect, useState, useCallback, useRef } from 'react';
import { socketService } from '@/lib/socket';

interface UseSocketOptions {
  autoConnect?: boolean;
  token?: string;
}

export function useSocket(options: UseSocketOptions = {}) {
  const { autoConnect = true, token } = options;
  const [isConnected, setIsConnected] = useState(false);
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

      const handleError = (err: any) => {
        if (mountedRef.current) {
          setError(err?.message || 'Socket error');
        }
      };

      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);
      socket.on('connect_error', handleError);

      setIsConnected(socket.connected);

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
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleData = (newData: any) => {
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
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    const handleAlert = (alert: any) => {
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

export interface LedDayEntry {
  date: string;
  led1_wh: number;
  led2_wh: number;
  led1_on_minutes: number;
  led2_on_minutes: number;
}

export interface AiAdvicePayload {
  time: string;
  advice: string[];
  anomaly: string | null;
  analysis: string;
  type: 'status' | 'alert';
  powerW: number;
  led1: boolean;
  led2: boolean;
  dailyLed: LedDayEntry;
}

export function useAiAdvice(maxItems = 20) {
  const [status, setStatus] = useState<AiAdvicePayload | null>(null);
  const [alerts, setAlerts] = useState<AiAdvicePayload[]>([]);

  useEffect(() => {
    const handleAdvice = (payload: AiAdvicePayload) => {
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
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const handleTriggered = (event: any) => {
      setEvents((prev) => [event, ...prev].slice(0, 100));
    };

    socketService.onAutomationTriggered(handleTriggered);

    return () => {
      socketService.getSocket()?.off('automation:triggered', handleTriggered);
    };
  }, []);

  return { events };
}
