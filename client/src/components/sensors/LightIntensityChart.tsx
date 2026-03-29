'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useSensorHistory, useSensorData } from '@/hooks/useSensors';
import { useChartColors } from '@/lib/chartDarkModeUtils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState } from 'react';

const dateLocaleMap = {
  vi: 'vi-VN',
  en: 'en-US',
  zh: 'zh-CN',
} as const;

interface LightIntensityChartProps {
  hours?: number;
}

const LightIntensityChart: React.FC<LightIntensityChartProps> = ({ hours = 24 }) => {
  const [timeRange, setTimeRange] = useState(hours);
  const { data: historyResponse, isLoading, error } = useSensorHistory(timeRange, 1, 10000);
  const { data: currentResponse } = useSensorData();
  const colors = useChartColors();
  const { t, language } = useLanguage();

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg p-6 border border-border">
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
        <p className="text-red-600">{t('sensors.loadLightError')}</p>
      </div>
    );
  }

  const historyData = ((historyResponse as any)?.data || []) as any[];
  const chartData = historyData
    .slice()
    .reverse()
    .map((item) => ({
      time: new Date(item.timestamp).toLocaleTimeString(dateLocaleMap[language], { hour: '2-digit', minute: '2-digit' }),
      light: item.lightLevel,
      timestamp: item.timestamp,
    }));

  if (chartData.length === 0) {
    return (
      <div className="bg-card rounded-lg p-6 border border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">{t('sensors.lightIntensity')}</h2>
        <p className="text-muted-foreground text-center py-8">{t('sensors.noHistoryData')}</p>
      </div>
    );
  }

  const currentLight = ((currentResponse as any)?.data?.lightLevel || 0);
  const avgLight = chartData.reduce((sum, item) => sum + item.light, 0) / chartData.length;

  return (
    <div className="bg-card rounded-lg p-6 border border-border min-w-0">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-foreground">{t('sensors.lightIntensity')}</h2>
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

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.gridColor} />
          <XAxis
            dataKey="time"
            stroke={colors.axisColor}
            style={{ fontSize: '12px' }}
            tick={{ fill: colors.axisLabelColor }}
          />
          <YAxis
            stroke={colors.axisColor}
            style={{ fontSize: '12px' }}
            tick={{ fill: colors.axisLabelColor }}
            label={{ value: 'lux', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: colors.backgroundColor,
              border: `1px solid ${colors.borderColor}`,
              borderRadius: '0.5rem',
              fontSize: '12px',
              color: colors.textColor
            }}
            formatter={(value: number | undefined) => [`${value || 0} lux`, t('sensors.lightIntensity')]}
          />
          <Legend wrapperStyle={{ color: colors.axisLabelColor }} />
          <ReferenceLine
            y={300}
            stroke="#f59e0b"
            strokeDasharray="3 3"
            label={{ value: t('sensors.optimalThreshold'), position: 'right', fontSize: 10, fill: colors.axisLabelColor }}
          />
          <Line
            type="monotone"
            dataKey="light"
            stroke="#eab308"
            strokeWidth={2}
            dot={{ fill: '#eab308', r: 4 }}
            activeDot={{ r: 6 }}
            name={t('sensors.lightIntensity')}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LightIntensityChart;
