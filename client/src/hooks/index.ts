// Device hooks
export * from './useDevices';

// Sensor hooks
export * from './useSensors';

// Dashboard hooks
export * from './useDashboard';

// Automation hooks
export * from './useAutomation';

// Energy hooks
export { energyKeys, useBatteryStatus, useSolarStats, usePowerSources, useEfficiencyMetrics } from './useEnergy';

// Billing hooks
export * from './useBilling';

// Socket hooks - explicit exports to avoid naming conflicts
export {
  useSocket,
  useIoTData,
  useSystemAlerts,
  useDeviceControl,
  useAutomationEvents,
  useAiAdvice,
} from './useSocket';

// Auth hooks
export { useAuth } from '../contexts/AuthContext';
