'use client';

import { useSensors } from '@/hooks/sensors';
import { useLanguage } from '@/contexts/LanguageContext';
import { calculateRainProbability, estimatePressureTrend, getColorScheme } from '@/lib/rainProbabilityUtils';
import { Gauge, Sparkles } from 'lucide-react';

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
  const records = (response as SensorsResponseShape | undefined)?.data ?? [];
  const data = records[0] || null;
  const { t, language } = useLanguage();

  if (isLoading || !data) {
    return (
      <div className="bg-card rounded-lg p-6 border border-border animate-pulse">
        <div className="h-40 bg-muted rounded"></div>
      </div>
    );
  }

  const pressureTrend = estimatePressureTrend(records);
  const analysis = calculateRainProbability(
    data.temperature,
    data.humidity,
    data.pressure,
    data.isRaining ?? false,
    pressureTrend,
    language,
  );
  const rainProbability = analysis.probability;
  const colorScheme = getColorScheme(rainProbability);

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
            badge={data.isRaining ? t('dashboard.rainingNow') : rainProbability >= 80 ? t('sensors.highChance') : rainProbability >= 60 ? t('sensors.mediumChance') : rainProbability >= 40 ? t('dashboard.lowMedium') : t('sensors.lowChance')}
            badgeColor={colorScheme.badge}
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
          status={t('dashboard.stable')}
          borderColor="#a855f7"
          bgColor="bg-purple-50"
          icon={<Gauge className="w-5 h-5" />}
        />
      </div>
    </div>
  );
}
