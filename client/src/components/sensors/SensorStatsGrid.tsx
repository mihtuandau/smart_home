'use client';

import { useSensorData } from '@/hooks/useSensors';
import { CloudRain, Droplets, Gauge, Thermometer, TrendingDown, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface SensorCurrentData {
  temperature: number;
  humidity: number;
  pressure: number;
  lightLevel: number;
  isDark: boolean;
  isRaining: boolean;
  timestamp: string;
  comfort: string;
}

interface StatCardProps {
  label: string;
  value: string;
  subtitle: string;
  color: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

function SensorStatCard({ label, value, subtitle, color, icon, trend }: StatCardProps) {
  return (
    <div className="section-card shadow-sm border border-border p-3 sm:p-4 md:p-6 hover:shadow-md md:hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-3 md:items-start md:justify-between md:gap-0">
        <div className="order-1 md:order-2 flex-shrink-0" style={{ color }}>
          {icon}
        </div>

        <div className="order-2 md:order-1 flex-1 min-w-0">
          <p className="text-[11px] sm:text-xs md:text-sm font-medium text-muted-foreground mb-2.5 md:mb-3 truncate">{label}</p>
          <p className="text-lg sm:text-xl md:text-3xl font-bold text-foreground leading-tight mb-2">{value}</p>
          <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">{subtitle}</p>
          {trend && (
            <div className={`flex items-center gap-1 mt-1 md:mt-2 text-[11px] sm:text-xs md:text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>{trend.value}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SensorStatsGrid() {
  const { data: response, isLoading } = useSensorData(3000);
  const data = (response as any)?.data as SensorCurrentData | undefined;
  const { t, language } = useLanguage();

  const formatNumber = (value: unknown, digits: number) => {
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed.toFixed(digits) : '--';
  };

  const formatWithUnit = (value: unknown, digits: number, unit: string) => {
    const formatted = formatNumber(value, digits);
    return formatted === '--' ? '--' : `${formatted}${unit}`;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="section-card shadow-sm border border-border p-3 sm:p-4 md:p-6 animate-pulse">
            <div className="h-14 md:h-24 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const stats: StatCardProps[] = [
    {
      label: t('sensors.temperature'),
      value: formatWithUnit(data?.temperature, 1, '°C'),
      subtitle: t('sensors.temperatureSubtitle'),
      color: '#ef4444',
      icon: <Thermometer className="w-6 h-6" />,
    },
    {
      label: t('sensors.humidity'),
      value: formatWithUnit(data?.humidity, 1, '%'),
      subtitle: t('sensors.humiditySubtitle'),
      color: '#3b82f6',
      icon: <Droplets className="w-6 h-6" />,
    },
    {
      label: t('sensors.pressure'),
      value: formatWithUnit(data?.pressure, 1, ' hPa'),
      subtitle: t('sensors.pressureSubtitle'),
      color: '#8b5cf6',
      icon: <Gauge className="w-6 h-6" />,
    },
    {
      label: t('sensors.rainSensor'),
      value: data?.isRaining ? t('sensors.raining') : t('sensors.notRaining'),
      subtitle: data?.isRaining ? t('sensors.rainingSubtitle') : t('sensors.notRainingSubtitle'),
      color: data?.isRaining ? '#3b82f6' : '#94a3b8',
      icon: <CloudRain className="w-6 h-6" />,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((stat, index) => (
        <SensorStatCard key={index} {...stat} />
      ))}
    </div>
  );
}
