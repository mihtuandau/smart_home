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
import { useEnergyStats } from "@/hooks/energy";
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

interface EnergyPoint {
  timestamp?: string;
  current?: number;
  voltage?: number;
}

interface EnergyResponse {
  data?: EnergyPoint[];
}

export default function CurrentVoltageChart({ timeRange = 24 }: CurrentVoltageChartProps) {
  const { t, language } = useLanguage();
  const { data, isLoading } = useEnergyStats(timeRange);
  const colors = useChartColors();

  const chartData = useMemo(() => {
    const energyData = ((data as EnergyResponse | undefined)?.data || []) as EnergyPoint[];
    if (!energyData.length) return [];

    const slotsMap = new Map<string, { timestamp: string; data: EnergyPoint[] }>();
    const now = new Date();
    
    const intervalMs = timeRange <= 24 ? 5 * 60 * 1000 : 60 * 60 * 1000;
    const numSlots = Math.floor((timeRange * 60 * 60 * 1000) / intervalMs);

    for (let i = numSlots - 1; i >= 0; i--) {
      const slotTime = new Date(now.getTime() - i * intervalMs);
      if (timeRange <= 24) {
        slotTime.setMinutes(Math.floor(slotTime.getMinutes() / 5) * 5, 0, 0);
      } else {
        slotTime.setMinutes(0, 0, 0);
      }
      const key = slotTime.getTime().toString();
      slotsMap.set(key, { timestamp: slotTime.toISOString(), data: [] });
    }

    energyData.forEach((item) => {
      if (!item.timestamp) return;
      const itemDate = new Date(item.timestamp);
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
        (sum: number, item) => sum + (item.current || 0),
        0,
      ) / slot.data.length;
    const avgVoltage =
      slot.data.reduce(
        (sum: number, item) => sum + (item.voltage || 0),
        0,
      ) / slot.data.length;

    const formatOpts: Intl.DateTimeFormatOptions = timeRange > 24 
      ? { day: '2-digit', month: '2-digit', hour: '2-digit' } 
      : { hour: '2-digit', minute: '2-digit' };

    return {
      time: new Date(slot.timestamp).toLocaleTimeString(dateLocaleMap[language], formatOpts),
      current: parseFloat(((avgCurrent || 0) / 1000).toFixed(3)),
      voltage: parseFloat((avgVoltage || 0).toFixed(2)),
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
          <CartesianGrid strokeDasharray="3 3" stroke={colors.gridColor} vertical={false} />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 11, fill: colors.axisLabelColor }}
            axisLine={{ stroke: colors.axisColor, strokeWidth: 0.5 }}
            tickLine={false}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 11, fill: "#10b981" }}
            axisLine={false}
            tickLine={false}
            label={{
              value: 'A',
              angle: -90,
              position: "insideLeft",
              style: { fontSize: 11, fill: "#10b981", fontWeight: 600 },
            }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 11, fill: "#3b82f6" }}
            axisLine={false}
            tickLine={false}
            label={{
              value: 'V',
              angle: 90,
              position: "insideRight",
              style: { fontSize: 11, fill: "#3b82f6", fontWeight: 600 },
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: colors.backgroundColor,
              border: `none`,
              borderRadius: "12px",
              fontSize: "12px",
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              color: colors.textColor
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: "11px", paddingTop: "15px", color: colors.axisLabelColor }}
            iconType="circle"
          />
          <Line
            yAxisId="left"
            type="stepAfter"
            dataKey="current"
            stroke="#10b981"
            strokeWidth={3}
            name={t('energy.current')}
            dot={false}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="voltage"
            stroke="#3b82f6"
            strokeWidth={3}
            name={t('energy.voltage')}
            dot={false}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
    </div>
  );
}
