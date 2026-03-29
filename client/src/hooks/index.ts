export * from './useDevices';

export * from './useSensors';

export * from './useDashboard';

export * from './useAutomation';

export { energyKeys, useBatteryStatus, useSolarStats, usePowerSources, useEfficiencyMetrics } from './useEnergy';

export * from './useBilling';

export {
  useSocket,
  useIoTData,
  useSystemAlerts,
  useDeviceControl,
  useAutomationEvents,
  useAiAdvice,
} from './useSocket';

export { useAuth } from '../contexts/AuthContext';
