'use client';

import React from 'react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useSensorHistory } from '@/hooks/sensors';
import { useChartColors } from '@/lib/chartDarkModeUtils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMemo, useState } from 'react';

const dateLocaleMap = {
  vi: 'vi-VN',
  en: 'en-US',
  zh: 'zh-CN',
} as const;

interface TemperatureHumidityChartProps {
  hours?: number;
}

interface SensorHistoryPoint {
  timestamp: string;
  temperature?: number;
  humidity?: number;
}

interface SensorHistoryResponse {
  data?: SensorHistoryPoint[];
}

interface TooltipEntry {
  dataKey?: string;
  value?: number;
  payload?: {
    time?: string;
  };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: readonly TooltipEntry[];
}

const TemperatureHumidityChart: React.FC<TemperatureHumidityChartProps> = ({ hours = 24 }) => {
  const [timeRange, setTimeRange] = useState<number>(hours);
  const { data: historyResponse, isLoading, error } = useSensorHistory(timeRange, 1, 10000);
  const colors = useChartColors();
  const { t, language } = useLanguage();

  const toNumberOrNull = (value: unknown) => {
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const chartData = useMemo(() => {
    const historyData = ((historyResponse as any)?.data || []) as any[];
    if (!historyData || historyData.length === 0) return [];

    const slotsMap = new Map<string, { timestamp: string; temps: number[]; hums: number[] }>();
    const now = new Date();
    
    // Initialize slots for the selected time range
    for (let i = timeRange - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 60 * 60 * 1000);
      d.setMinutes(0, 0, 0);
      const key = d.getTime().toString();
      slotsMap.set(key, { timestamp: d.toISOString(), temps: [], hums: [] });
    }

    historyData.forEach((item) => {
      const time = new Date(item.timestamp);
      // Support both raw and aggregated field names
      const temperature = toNumberOrNull(item.temperature ?? item.temperatureAvg);
      const humidity = toNumberOrNull(item.humidity ?? item.humidityAvg);
      
      if (Number.isNaN(time.getTime())) return;
      
      time.setMinutes(0, 0, 0);
      const key = time.getTime().toString();
      const slot = slotsMap.get(key);
      if (slot) {
        if (temperature !== null) slot.temps.push(temperature);
        if (humidity !== null) slot.hums.push(humidity);
      }
    });

    return Array.from(slotsMap.values()).map((slot) => {
      const hasTemp = slot.temps.length > 0;
      const hasHum = slot.hums.length > 0;
      const avgTemp = hasTemp ? slot.temps.reduce((a, b) => a + b, 0) / slot.temps.length : null;
      const avgHum = hasHum ? slot.hums.reduce((a, b) => a + b, 0) / slot.hums.length : null;
      
      const formatOpts: Intl.DateTimeFormatOptions = timeRange > 24 
        ? { day: '2-digit', month: '2-digit', hour: '2-digit' } 
        : { hour: '2-digit', minute: '2-digit' };

      return {
        time: new Date(slot.timestamp).toLocaleTimeString(dateLocaleMap[language], formatOpts),
        temperature: avgTemp !== null ? parseFloat(avgTemp.toFixed(1)) : null,
        humidity: avgHum !== null ? Math.round(avgHum) : null,
        timestamp: slot.timestamp,
      };
    });
  }, [historyResponse, timeRange, language]);

  if (isLoading) {
    return (
      <div className="section-card shadow-sm border border-border p-4 sm:p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-lg p-6 border border-red-200 dark:border-red-800">
        <p className="text-red-600">{t('sensors.loadTemperatureHumidityError')}</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const humidityPayload = payload.find((entry) => entry?.dataKey === 'humidity');
      const temperaturePayload = payload.find((entry) => entry?.dataKey === 'temperature');

      return (
        <div className="bg-card dark:bg-slate-800 p-3 border border-border dark:border-slate-700 rounded-lg shadow-lg">
          <p className="text-xs font-semibold text-foreground/80 mb-2">{payload[0]?.payload?.time ?? '--:--'}</p>
          <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
            <span className="inline-block w-3 h-3 bg-blue-500 rounded-full"></span>
            {t('sensors.humidity')}: {humidityPayload?.value ?? '--'}%
          </p>
          <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
            <span className="inline-block w-3 h-3 bg-red-500 rounded-full"></span>
            {t('sensors.temperature')}: {temperaturePayload?.value ?? '--'}°C
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="section-card shadow-sm border border-border p-4 sm:p-6 min-w-0">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-foreground">{t('sensors.temperatureHumidityChart')}</h2>
        </div>
        <div className="flex sm:justify-end items-center">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="text-xs sm:text-sm border border-border bg-background rounded-md px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer max-w-fit shadow-sm"
          >
            <option value={6}>{t('sensors.lastHours').replace('{hours}', '6')}</option>
            <option value={12}>{t('sensors.lastHours').replace('{hours}', '12')}</option>
            <option value={24}>{t('sensors.lastHours').replace('{hours}', '24')}</option>
            <option value={72}>{t('sensors.lastDays').replace('{days}', '3')}</option>
            <option value={168}>{t('sensors.lastDays').replace('{days}', '7')}</option>
          </select>
        </div>
      </div>

      <div className="h-64 sm:h-96 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData}>
          <defs>
            <linearGradient id="colorHumidity" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.gridColor} vertical={false} />
          <XAxis
            dataKey="time"
            stroke={colors.axisColor}
            tick={{ fill: colors.axisLabelColor, fontSize: 11 }}
            tickLine={false}
            axisLine={{ strokeWidth: 0.5 }}
          />
          <YAxis
            yAxisId="left"
            stroke="#f43f5e"
            tick={{ fill: '#f43f5e', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            label={{ value: '°C', angle: -90, position: 'insideLeft', style: { fill: '#f43f5e', fontWeight: 600 } }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#14b8a6"
            tick={{ fill: '#14b8a6', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            label={{ value: '%', angle: 90, position: 'insideRight', style: { fill: '#14b8a6', fontWeight: 600 } }}
          />
          <Tooltip content={CustomTooltip} />
          <Legend
            wrapperStyle={{ paddingTop: '15px', fontSize: '11px', color: colors.axisLabelColor }}
            iconType="circle"
          />
          <Area
            yAxisId="right"
            type="monotone"
            dataKey="humidity"
            fill="url(#colorHumidity)"
            stroke="#14b8a6"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6, strokeWidth: 0 }}
            name={`${t('sensors.humidity')} (%)`}
            connectNulls={true}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="temperature"
            stroke="#f43f5e"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6, fill: '#f43f5e', strokeWidth: 0 }}
            name={`${t('sensors.temperature')} (°C)`}
            connectNulls={true}
          />
        </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TemperatureHumidityChart;
