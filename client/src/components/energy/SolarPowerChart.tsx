'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useSolarStats } from '@/hooks/energy';
import { useChartColors } from '@/lib/chartDarkModeUtils';
import { useLanguage } from '@/contexts/LanguageContext';
import { BarChart3 } from 'lucide-react';
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
    const solarDataFromAPI = Array.isArray((data as SolarResponse | undefined)?.data?.data)
      ? ((data as SolarResponse).data?.data as SolarPoint[])
      : [];
    if (!solarDataFromAPI.length) return [];

    const slotsMap = new Map<string, { timestamp: string; data: SolarPoint[] }>();
    const now = new Date();
    
    for (let i = timeRange - 1; i >= 0; i--) {
      const slotTime = new Date(now.getTime() - i * 60 * 60 * 1000);
      slotTime.setMinutes(0, 0, 0);
      const key = slotTime.getTime().toString();
      slotsMap.set(key, { timestamp: slotTime.toISOString(), data: [] });
    }

    solarDataFromAPI.forEach((item) => {
      if (!item.timestamp) return;
      const itemDate = item.timestamp instanceof Date ? item.timestamp : new Date(item.timestamp);
      if (isNaN(itemDate.getTime())) return;
      
      itemDate.setMinutes(0, 0, 0);
      const key = itemDate.getTime().toString();
      const slot = slotsMap.get(key);
      if (slot) slot.data.push(item);
    });

    return Array.from(slotsMap.values()).map((slot) => {
      const avgPower = slot.data.length > 0
        ? slot.data.reduce((sum, item) => sum + (item.power || 0), 0) / slot.data.length
        : 0;

      const formatOpts: Intl.DateTimeFormatOptions = timeRange > 24 
        ? { day: '2-digit', month: '2-digit', hour: '2-digit' } 
        : { hour: '2-digit', minute: '2-digit' };

      return {
        time: new Date(slot.timestamp).toLocaleTimeString(dateLocaleMap[language], formatOpts),
        power: parseFloat(avgPower.toFixed(2)),
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
          <h2 className="text-base sm:text-lg font-semibold text-foreground">{t('energy.solarPanelPowerChart')}</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">{t('energy.powerOverTime')}</p>
        </div>
        <div className="h-52 sm:h-64 flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="w-16 h-16 text-muted-foreground/40 mx-auto mb-3" />
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
        <h2 className="text-base sm:text-lg font-semibold text-foreground">{t('energy.solarPanelPowerChart')}</h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          {t('energy.powerOverTime')}
        </p>
      </div>

      <div className="h-52 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPower" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.gridColor} />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 12, fill: colors.axisLabelColor }}
              axisLine={{ stroke: colors.axisColor }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: colors.axisLabelColor }}
              axisLine={{ stroke: colors.axisColor }}
              unit="W"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: colors.backgroundColor,
                border: `1px solid ${colors.borderColor}`,
                borderRadius: '8px',
                fontSize: '12px',
                color: colors.textColor
              }}
              labelStyle={{ color: colors.textColor, fontWeight: 600 }}
            />
            <Area
              type="monotone"
              dataKey="power"
              stroke="#f59e0b"
              strokeWidth={2}
              fill="url(#colorPower)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
