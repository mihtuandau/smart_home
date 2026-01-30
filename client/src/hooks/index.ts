// Device hooks
export * from './useDevices';

// Sensor hooks
export * from './useSensors';

// Dashboard hooks
export * from './useDashboard';

// Socket hooks - explicit exports to avoid naming conflicts
export {
  useSocket,
  useIoTData,
  useSystemAlerts,
  useDeviceControl,
  useAutomationEvents,
} from './useSocket';

// Auth hooks
export { useAuth } from '../contexts/AuthContext';
