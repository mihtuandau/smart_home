'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useSolarStats } from '@/hooks/energy';
import { useChartColors } from '@/lib/chartDarkModeUtils';
import { useLanguage } from '@/contexts/LanguageContext';
import { Activity, BarChart3 } from 'lucide-react';
import { useMemo } from 'react';

const dateLocaleMap = {
  vi: 'vi-VN',
  en: 'en-US',
  zh: 'zh-CN',
} as const;

interface SolarPowerChartProps {
  timeRange?: number;
}

interface SolarPoint {
  timestamp?: string | Date;
  power?: number;
}

interface SolarResponse {
  data?: {
    data?: SolarPoint[];
  };
}

export default function SolarPowerChart({ timeRange = 24 }: SolarPowerChartProps) {
  const { t, language } = useLanguage();
  const { data, isLoading } = useSolarStats(timeRange);
  const colors = useChartColors();

  const chartData = useMemo(() => {
    const solarDataFromAPI = Array.isArray((data as any)?.data)
      ? ((data as any).data as SolarPoint[])
      : [];
    if (!solarDataFromAPI.length) return [];

    const slotsMap = new Map<string, { timestamp: string; data: SolarPoint[] }>();
    const now = new Date();
    
    const intervalMs = timeRange <= 24 ? 5 * 60 * 1000 : 60 * 60 * 1000;
    const numSlots = Math.floor((timeRange * 60 * 60 * 1000) / intervalMs);

    for (let i = numSlots - 1; i >= 0; i--) {
      const slotTime = new Date(now.getTime() - i * intervalMs);
      if (timeRange <= 24) {
        // Round to 5 mins
        slotTime.setMinutes(Math.floor(slotTime.getMinutes() / 5) * 5, 0, 0);
      } else {
        slotTime.setMinutes(0, 0, 0);
      }
      const key = slotTime.getTime().toString();
      slotsMap.set(key, { timestamp: slotTime.toISOString(), data: [] });
    }

    solarDataFromAPI.forEach((item) => {
      if (!item.timestamp) return;
      const itemDate = item.timestamp instanceof Date ? item.timestamp : new Date(item.timestamp);
      if (isNaN(itemDate.getTime())) return;
      
      if (timeRange <= 24) {
        itemDate.setMinutes(Math.floor(itemDate.getMinutes() / 5) * 5, 0, 0);
      } else {
        itemDate.setMinutes(0, 0, 0);
      }
      const key = itemDate.getTime().toString();
      const slot = slotsMap.get(key);
      if (slot) slot.data.push(item);
    });

    return Array.from(slotsMap.values()).map((slot) => {
      const avgPowerMw = slot.data.length > 0
        ? slot.data.reduce((sum, item) => sum + (item.power || 0), 0) / slot.data.length
        : 0;

      const formatOpts: Intl.DateTimeFormatOptions = timeRange > 24 
        ? { day: '2-digit', month: '2-digit', hour: '2-digit' } 
        : { hour: '2-digit', minute: '2-digit' };

      return {
        time: new Date(slot.timestamp).toLocaleTimeString(dateLocaleMap[language], formatOpts),
        power: parseFloat((avgPowerMw / 1000).toFixed(2)),
      };
    });
  }, [data, timeRange, language]);

  if (isLoading) {
    return (
      <div className="section-card shadow-sm border border-border p-4 sm:p-6 animate-pulse">
        <div className="h-64"></div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="section-card shadow-sm border border-border p-4 sm:p-6">
        <div className="mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-foreground">{t('energy.consumption')}</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">{t('energy.powerOverTime')}</p>
        </div>
        <div className="h-52 sm:h-64 flex items-center justify-center">
          <div className="text-center">
            <Activity className="w-16 h-16 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">{t('energy.noSolarData')}</p>
            <p className="text-xs text-muted-foreground mt-1">{t('energy.solarDataHint')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section-card shadow-sm border border-border p-4 sm:p-6">
      <div className="mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-foreground">{t('energy.consumption')}</h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          {t('energy.powerOverTime')}
        </p>
      </div>

    <div className="h-52 sm:h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPower" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.gridColor} vertical={false} />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 11, fill: colors.axisLabelColor }}
            axisLine={{ stroke: colors.axisColor, strokeWidth: 0.5 }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: colors.axisLabelColor }}
            axisLine={false}
            tickLine={false}
            unit="W"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: colors.backgroundColor,
              border: `none`,
              borderRadius: '12px',
              fontSize: '12px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              color: colors.textColor
            }}
            labelStyle={{ color: colors.textColor, fontWeight: 600, marginBottom: '4px' }}
          />
          <Area
            type="monotone"
            dataKey="power"
            stroke="#6366f1"
            strokeWidth={3}
            fill="url(#colorPower)"
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
    </div>
  );
}
