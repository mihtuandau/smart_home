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

interface LightIntensityChartProps {
  hours?: number;
}

const LightIntensityChart: React.FC<LightIntensityChartProps> = ({ hours = 24 }) => {
  const { data: historyResponse, isLoading, error } = useSensorHistory(hours);
  const { data: currentResponse } = useSensorData();
  const colors = useChartColors();

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
        <p className="text-red-600">Không thể tải dữ liệu cường độ ánh sáng</p>
      </div>
    );
  }

  // Transform API data to chart format
  const historyData = ((historyResponse as any)?.data || []) as any[];
  const chartData = historyData
    .slice()
    .reverse()
    .map((item) => ({
      time: new Date(item.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      light: item.lightLevel,
      timestamp: item.timestamp,
    }));

  // If no history data, show placeholder message
  if (chartData.length === 0) {
    return (
      <div className="bg-card rounded-lg p-6 border border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">Cường độ ánh sáng</h2>
        <p className="text-muted-foreground text-center py-8">Không có dữ liệu lịch sử</p>
      </div>
    );
  }

  const currentLight = ((currentResponse as any)?.data?.lightLevel || 0);
  const avgLight = chartData.reduce((sum, item) => sum + item.light, 0) / chartData.length;

  return (
    <div className="bg-card rounded-lg p-6 border border-border">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">Cường độ ánh sáng</h2>
        <p className="text-sm text-muted-foreground mt-1">{hours} giờ qua</p>
      </div>

      {/* Chart */}
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
            formatter={(value: number | undefined) => [`${value || 0} lux`, 'Ánh sáng']}
          />
          <Legend wrapperStyle={{ color: colors.axisLabelColor }} />
          <ReferenceLine 
            y={300} 
            stroke="#f59e0b" 
            strokeDasharray="3 3"
            label={{ value: 'Ngưỡng tối ưu', position: 'right', fontSize: 10, fill: colors.axisLabelColor }}
          />
          <Line
            type="monotone"
            dataKey="light"
            stroke="#eab308"
            strokeWidth={2}
            dot={{ fill: '#eab308', r: 4 }}
            activeDot={{ r: 6 }}
            name="Cường độ sáng"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LightIntensityChart;
