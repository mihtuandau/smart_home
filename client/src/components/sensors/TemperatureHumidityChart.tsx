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
import { useSensorHistory, useSensorData } from '@/hooks/useSensors';
import { useChartColors } from '@/lib/chartDarkModeUtils';
import { useLanguage } from '@/contexts/LanguageContext';

interface TemperatureHumidityChartProps {
  hours?: number;
}

const TemperatureHumidityChart: React.FC<TemperatureHumidityChartProps> = ({ hours = 24 }) => {
  const { data: historyResponse, isLoading, error } = useSensorHistory(hours);
  const { data: currentResponse } = useSensorData();
  const colors = useChartColors();
  const { t, language } = useLanguage();

  const toNumberOrNull = (value: unknown) => {
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

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

  // Transform API data to chart format
  const historyData = ((historyResponse as any)?.data || []) as any[];
  const chartData = historyData
    .slice()
    .reverse()
    .map((item) => {
      const temperature = toNumberOrNull(item.temperature);
      const humidity = toNumberOrNull(item.humidity);
      const time = new Date(item.timestamp);

      if (temperature === null || humidity === null || Number.isNaN(time.getTime())) {
        return null;
      }

      return {
        time: time.toLocaleTimeString(language === 'en' ? 'en-US' : 'vi-VN', { hour: '2-digit', minute: '2-digit' }),
        temperature,
        humidity,
        timestamp: item.timestamp,
      };
    })
    .filter((item): item is { time: string; temperature: number; humidity: number; timestamp: string } => item !== null);

  // If no history data, show placeholder message
  if (chartData.length === 0) {
    return (
      <div className="section-card shadow-sm border border-border p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-foreground mb-4">{t('sensors.temperatureHumidityChart')}</h2>
        <p className="text-muted-foreground text-center py-8">{t('sensors.noHistoryData')}</p>
      </div>
    );
  }

  const currentTemp = toNumberOrNull((currentResponse as any)?.data?.temperature) ?? 0;
  const currentHumidity = toNumberOrNull((currentResponse as any)?.data?.humidity) ?? 0;
  
  const avgTemp = chartData.reduce((sum, item) => sum + item.temperature, 0) / chartData.length;
  const avgHumidity = chartData.reduce((sum, item) => sum + item.humidity, 0) / chartData.length;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const humidityPayload = payload.find((entry: any) => entry?.dataKey === 'humidity');
      const temperaturePayload = payload.find((entry: any) => entry?.dataKey === 'temperature');

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
      <div className="mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-foreground">{t('sensors.temperatureHumidityChart')}</h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">{t('sensors.lastHours').replace('{hours}', String(hours))}</p>
      </div>

      {/* Chart */}
      <div className="h-64 sm:h-96 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData}>
          <defs>
            <linearGradient id="colorHumidity" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.gridColor} />
          <XAxis 
            dataKey="time" 
            stroke={colors.axisColor}
            tick={{ fill: colors.axisLabelColor, fontSize: 12 }}
          />
          <YAxis 
            yAxisId="left"
            stroke="#ef4444"
            tick={{ fill: '#ef4444', fontSize: 12 }}
            label={{ value: '°C', angle: -90, position: 'insideLeft' }}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            stroke="#3b82f6"
            tick={{ fill: '#3b82f6', fontSize: 12 }}
            label={{ value: '%', angle: 90, position: 'insideRight' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '10px', fontSize: '12px', color: colors.axisLabelColor }}
          />
          <Area
            yAxisId="right"
            type="natural"
            dataKey="humidity"
            fill="url(#colorHumidity)"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
            name={`${t('sensors.humidity')} (%)`}
          />
          <Line
            yAxisId="left"
            type="natural"
            dataKey="temperature"
            stroke="#ef4444"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6, fill: '#ef4444' }}
            name={`${t('sensors.temperature')} (°C)`}
          />
        </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TemperatureHumidityChart;
