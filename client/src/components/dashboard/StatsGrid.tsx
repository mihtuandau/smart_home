'use client';

import StatCard from './StatCard';
import { useLatestDeviceData, useDeviceStats } from '@/hooks/devices';
import { useEnergyStats } from '@/hooks/energy';
import { useLanguage } from '@/contexts/LanguageContext';

interface DeviceSnapshot {
  led1?: boolean;
  led2?: boolean;
  device1?: unknown;
  device2?: unknown;
  temperature?: number;
  humidity?: number;
  voltage?: number;
  current_mA?: number;
}

interface StatsSnapshot {
  online?: number;
  total?: number;
}

interface ApiDataResponse<T> {
  data?: T;
}

interface EnergyPoint {
  energy?: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export default function StatsGrid() {
  const { t } = useLanguage();
  const { data: latestResponse, isLoading: latestLoading } = useLatestDeviceData(2000);
  const { data: statsResponse, isLoading: statsLoading } = useDeviceStats();
  const { data: energyResponse, isLoading: energyLoading } = useEnergyStats(24, 3000);

  const latestData = (latestResponse as ApiDataResponse<DeviceSnapshot> | undefined)?.data;
  const statsData = (statsResponse as ApiDataResponse<StatsSnapshot> | undefined)?.data;

  const isCustomDevicePresent = (value: unknown) => {
    if (value === undefined || value === null) return false;
    if (isRecord(value)) {
      return Boolean(value.name) || value.state !== undefined || value.power !== undefined;
    }
    return true;
  };

  const energyArray = (energyResponse as ApiDataResponse<EnergyPoint[]> | undefined)?.data || [];
  const totalSolarEnergy = energyArray.reduce((sum: number, item) => sum + (item.energy || 0), 0);

  const isLoading = latestLoading || statsLoading || energyLoading;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card rounded-lg p-6 border border-border animate-pulse">
            <div className="h-20 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const devicesOn = Math.max(0, statsData?.online ?? 0);
  const customCountFromLatest = [latestData?.device1, latestData?.device2].filter(isCustomDevicePresent).length;
  const totalFromLatest = 2 + customCountFromLatest;
  const totalDevices = Math.max(2, statsData?.total ?? 2, totalFromLatest);

  const stats = [
    {
      label: t('dashboard.activeDevices'),
      value: `${devicesOn}/${totalDevices}`,
      color: '#10b981',
      subtitle: t('dashboard.onState')
    },
    {
      label: t('dashboard.todayEnergy'),
      value: `${(totalSolarEnergy / 1000).toFixed(2)} kWh`,
      color: '#f59e0b',
      subtitle: t('energy.solarPower')
    },
    {
      label: t('sensors.temperature'),
      value: latestData?.temperature !== undefined ? `${latestData.temperature.toFixed(1)}°C` : '--',
      color: '#ef4444',
      subtitle: `${t('dashboard.humidityLabel')}: ${latestData?.humidity !== undefined ? latestData.humidity.toFixed(1) : '--'}%`
    },
    {
      label: t('dashboard.systemVoltage'),
      value: latestData?.voltage !== undefined ? `${latestData.voltage.toFixed(2)}V` : '--',
      color: '#3b82f6',
      subtitle: `${latestData?.current_mA !== undefined ? (latestData.current_mA / 1000).toFixed(2) : '--'}A`
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
}
