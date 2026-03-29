"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useEnergyStats } from "@/hooks/useEnergy";
import { useChartColors } from "@/lib/chartDarkModeUtils";
import { useLanguage } from '@/contexts/LanguageContext';
import { useMemo } from 'react';

const dateLocaleMap = {
  vi: 'vi-VN',
  en: 'en-US',
  zh: 'zh-CN',
} as const;

interface CurrentVoltageChartProps {
  timeRange?: number;
}

export default function CurrentVoltageChart({ timeRange = 24 }: CurrentVoltageChartProps) {
  const { t, language } = useLanguage();
  const { data, isLoading } = useEnergyStats(timeRange);
  const colors = useChartColors();

  const chartData = useMemo(() => {
    const energyData = (data as any)?.data || [];
    if (!energyData.length) return [];

    const slotsMap = new Map<string, { timestamp: string; data: any[] }>();
    const now = new Date();
    
    for (let i = timeRange - 1; i >= 0; i--) {
      const slotTime = new Date(now.getTime() - i * 60 * 60 * 1000);
      slotTime.setMinutes(0, 0, 0);
      const key = slotTime.getTime().toString();
      slotsMap.set(key, { timestamp: slotTime.toISOString(), data: [] });
    }

    energyData.forEach((item: any) => {
      const itemDate = new Date(item.timestamp);
      if (isNaN(itemDate.getTime())) return;
      itemDate.setMinutes(0, 0, 0);
      const key = itemDate.getTime().toString();
      const slot = slotsMap.get(key);
      if (slot) slot.data.push(item);
    });

    return Array.from(slotsMap.values()).map((slot) => {
      if (slot.data.length === 0) {
        const formatOpts: Intl.DateTimeFormatOptions = timeRange > 24 
          ? { day: '2-digit', month: '2-digit', hour: '2-digit' } 
          : { hour: '2-digit', minute: '2-digit' };
        return {
          time: new Date(slot.timestamp).toLocaleTimeString(dateLocaleMap[language], formatOpts),
          current: 0,
          voltage: 0,
        };
      }

    const avgCurrent =
      slot.data.reduce(
        (sum: number, item: any) => sum + (item.current || 0),
        0,
      ) / slot.data.length;
    const avgVoltage =
      slot.data.reduce(
        (sum: number, item: any) => sum + (item.voltage || 0),
        0,
      ) / slot.data.length;

    const formatOpts: Intl.DateTimeFormatOptions = timeRange > 24 
      ? { day: '2-digit', month: '2-digit', hour: '2-digit' } 
      : { hour: '2-digit', minute: '2-digit' };

    return {
      time: new Date(slot.timestamp).toLocaleTimeString(dateLocaleMap[language], formatOpts),
      current: parseFloat(avgCurrent.toFixed(2)),
      voltage: parseFloat(avgVoltage.toFixed(2)),
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

  return (
    <div className="section-card shadow-sm border border-border p-4 sm:p-6">
      <div className="mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-foreground">
          {t('energy.currentAndVoltage')}
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {t('energy.monitoringChart')}
        </p>
      </div>

      <div className="h-52 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 30, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={colors.gridColor} />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 12, fill: colors.axisLabelColor }}
              axisLine={{ stroke: colors.axisColor }}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 12, fill: "#10b981" }}
              axisLine={{ stroke: "#10b981" }}
              label={{
                value: t('energy.currentAxis'),
                angle: -90,
                position: "insideLeft",
                style: { fontSize: 12, fill: "#10b981" },
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12, fill: "#3b82f6" }}
              axisLine={{ stroke: "#3b82f6" }}
              label={{
                value: t('energy.voltageAxis'),
                angle: 90,
                position: "insideRight",
                style: { fontSize: 12, fill: "#3b82f6" },
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: colors.backgroundColor,
                border: `1px solid ${colors.borderColor}`,
                borderRadius: "8px",
                fontSize: "12px",
                color: colors.textColor
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: "12px", paddingTop: "10px", color: colors.axisLabelColor }}
              iconType="line"
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="current"
              stroke="#10b981"
              strokeWidth={2}
              name={t('energy.currentAxis')}
              dot={false}
              activeDot={{ r: 5 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="voltage"
              stroke="#3b82f6"
              strokeWidth={2}
              name={t('energy.voltageAxis')}
              dot={false}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
