'use client';

import { useSensors } from '@/hooks/sensors';
import { useRainProbability } from '@/hooks/rain';
import { useLanguage } from '@/contexts/LanguageContext';
import { estimatePressureTrend } from '@/lib/rainProbabilityUtils';
import { Gauge, Sparkles } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { rainForecastKeys } from '@/hooks/rain/rainForecastKeys';

interface EnvironmentSensorData {
  temperature: number;
  humidity: number;
  pressure: number;
  isRaining?: boolean;
  timestamp?: string | number | Date;
}

interface SensorsResponseShape {
  data?: EnvironmentSensorData[];
}

interface SensorCardProps {
  title: string;
  value: string;
  badge?: string;
  badgeColor?: string;
  borderColor: string;
  bgColor: string;
  icon: React.ReactNode;
}

function SensorCard({ title, value, badge, badgeColor, borderColor, bgColor, icon }: SensorCardProps) {
  return (
    <div
      className={`rounded-lg p-4 sm:p-5 border transition-shadow hover:shadow-sm ${bgColor}`}
      style={{ borderColor: borderColor }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg inline-flex items-center">{icon}</span>
        <span className="text-sm font-semibold text-foreground/80">{title}</span>
      </div>
      <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">{value}</h3>
      {badge && (
        <span className={`inline-block px-3 py-1 rounded-md text-xs font-semibold ${badgeColor || 'bg-blue-600 text-white'}`}>
          {badge}
        </span>
      )}
    </div>
  );
}

interface PressureCardProps {
  title: string;
  subtitle: string;
  value: string;
  statusLabel: string;
  status: string;
  borderColor: string;
  bgColor: string;
  icon: React.ReactNode;
}

function PressureCard({ title, subtitle, value, statusLabel, status, borderColor, bgColor, icon }: PressureCardProps) {
  return (
    <div
      className={`rounded-lg p-4 sm:p-5 border ${bgColor} dark:bg-card`}
      style={{ borderColor: borderColor }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg inline-flex items-center">{icon}</span>
            <span className="text-sm font-semibold text-foreground/80">{title}</span>
          </div>
          <p className="text-xs text-muted-foreground mb-2">{subtitle}</p>
          <h3 className="text-2xl sm:text-3xl font-bold text-foreground">{value}</h3>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground mb-2">{statusLabel}</p>
          <span className="inline-block px-3 py-1 rounded-md text-xs font-semibold bg-green-100 text-green-700">
            {status}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function EnvironmentStatus() {
  const { data: response, isLoading } = useSensors(6, 2000);
  const { data: rainReport, refetch: refetchRain } = useRainProbability(10.9509538, 106.8226134, true);
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const lastSensorChangeRef = useRef<string>('');

  const records = (response as SensorsResponseShape | undefined)?.data ?? [];
  const data = records[0] || null;

  // Invalidate rain forecast query when sensor data changes
  useEffect(() => {
    if (data) {
      const sensorKey = `${data.temperature}-${data.humidity}-${data.pressure}`;
      if (sensorKey !== lastSensorChangeRef.current) {
        lastSensorChangeRef.current = sensorKey;
        console.log('[EnvironmentStatus] Sensor change detected:', sensorKey);
        // Both invalidate AND refetch for aggressive update
        queryClient.invalidateQueries({
          queryKey: rainForecastKeys.probability(10.9509538, 106.8226134)
        });
        refetchRain?.();
      }
    }
  }, [data, queryClient, refetchRain]);

  if (isLoading || !data) {
    return (
      <div className="bg-card rounded-lg p-6 border border-border animate-pulse">
        <div className="h-40 bg-muted rounded"></div>
      </div>
    );
  }

  // Use rain forecast API data if available
  // Note: getLatestRainProbability returns { adjusted_probability, unit }
  let rainProbability = 0;
  if (rainReport?.adjusted_probability !== null && rainReport?.adjusted_probability !== undefined) {
    rainProbability = Math.round(rainReport.adjusted_probability);
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[EnvironmentStatus] rainReport:', rainReport, '| rainProbability:', rainProbability);
  }

  // Get color scheme matching Sensors page (based on percentage)
  const getRainProbabilityColors = (probability: number) => {
    if (probability >= 80) {
      return { 
        bg: 'bg-red-50 dark:bg-red-950/30', 
        border: '#dc2626', 
        badgeColor: 'bg-red-600 text-white',
        descKey: 'sensors.highChance'
      };
    }
    if (probability >= 60) {
      return { 
        bg: 'bg-orange-50 dark:bg-orange-950/30', 
        border: '#f59e0b', 
        badgeColor: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
        descKey: 'sensors.mediumChance'
      };
    }
    if (probability >= 40) {
      return { 
        bg: 'bg-yellow-50 dark:bg-yellow-950/30', 
        border: '#eab308', 
        badgeColor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
        descKey: 'dashboard.lowMedium'
      };
    }
    if (probability >= 20) {
      return { 
        bg: 'bg-blue-50 dark:bg-blue-950/30', 
        border: '#3b82f6', 
        badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
        descKey: 'sensors.lowChance'
      };
    }
    return { 
      bg: 'bg-green-50 dark:bg-green-950/30', 
      border: '#10b981', 
      badgeColor: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
      descKey: 'sensors.lowChance'
    };
  };

  const pressureTrend = estimatePressureTrend(records);
  const colorScheme = getRainProbabilityColors(rainProbability);

  const getPressureStatus = (pressure: number) => {
    if (pressure < 1000) return t('sensors.pressureVeryLow');
    if (pressure < 1013) return t('sensors.pressureSlightLow');
    if (pressure < 1030) return t('sensors.pressureNormal');
    return t('sensors.pressureHigh');
  };

  return (
    <div className="section-card shadow-sm border border-border p-4 sm:p-5 md:p-6">
      <div className="mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-foreground">{t('dashboard.environmentStatus')}</h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">{t('dashboard.environmentInfo')}</p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <SensorCard
            title={t('dashboard.rainProbability')}
            value={`${rainProbability}%`}
            badge={data.isRaining ? t('dashboard.rainingNow') : t(colorScheme.descKey)}
            badgeColor={colorScheme.badgeColor}
            borderColor={colorScheme.border}
            bgColor={colorScheme.bg}
            icon={<Sparkles className="w-5 h-5" />}
          />
        </div>

        <PressureCard
          title={t('dashboard.pressureAtmospheric')}
          subtitle={t('dashboard.pressureCurrent')}
          value={`${data.pressure.toFixed(1)} hPa`}
          statusLabel={t('devices.status')}
          status={getPressureStatus(data.pressure)}
          borderColor="#a855f7"
          bgColor="bg-purple-50"
          icon={<Gauge className="w-5 h-5" />}
        />
      </div>
    </div>
  );
}
