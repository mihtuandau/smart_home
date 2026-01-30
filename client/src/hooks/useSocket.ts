import { useEffect, useState, useCallback, useRef } from 'react';
import { socketService } from '@/lib/socket';

interface UseSocketOptions {
  autoConnect?: boolean;
  token?: string;
}

/**
 * Custom hook for Socket.IO connection
 */
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

      // Set initial state
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

/**
 * Custom hook for listening to IoT data updates
 */
export function useIoTData() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleData = (newData: any) => {
      setData(newData);
      setLoading(false);
    };

    socketService.onIoTData(handleData);

    // Request initial data
    socketService.requestIoTData();

    return () => {
      socketService.offIoTData(handleData);
    };
  }, []);

  return { data, loading };
}

/**
 * Custom hook for listening to sensor updates
 * Note: Use useSensors() from useSensors.ts instead for REST polling
 * This is kept for real-time socket updates if needed
 */
// export function useSensorUpdates() { ... } - REMOVED, use useSensors instead

/**
 * Custom hook for listening to device status updates
 * Note: Use useDeviceStatus() from useDevices.ts instead for REST polling
 * This is kept for real-time socket updates if needed
 */
// export function useDeviceStatus() { ... } - REMOVED, use useDeviceStatus from useDevices instead

/**
 * Custom hook for listening to system alerts
 */
export function useSystemAlerts() {
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    const handleAlert = (alert: any) => {
      setAlerts((prev) => [alert, ...prev].slice(0, 50)); // Keep last 50 alerts
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

/**
 * Custom hook for controlling devices via socket
 */
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

/**
 * Custom hook for automation events
 */
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
