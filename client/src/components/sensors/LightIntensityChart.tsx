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

interface LightIntensityChartProps {
  hours?: number;
}

const LightIntensityChart: React.FC<LightIntensityChartProps> = ({ hours = 24 }) => {
  const { data: historyResponse, isLoading, error } = useSensorHistory(hours);
  const { data: currentResponse } = useSensorData();

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg p-6 border border-red-200">
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
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Cường độ ánh sáng</h2>
        <p className="text-gray-500 text-center py-8">Không có dữ liệu lịch sử</p>
      </div>
    );
  }

  const currentLight = ((currentResponse as any)?.data?.lightLevel || 0);
  const avgLight = chartData.reduce((sum, item) => sum + item.light, 0) / chartData.length;

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Cường độ ánh sáng</h2>
        <p className="text-sm text-gray-500 mt-1">{hours} giờ qua</p>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="time" 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            label={{ value: 'lux', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              fontSize: '12px'
            }}
            formatter={(value: number | undefined) => [`${value || 0} lux`, 'Ánh sáng']}
          />
          <Legend />
          <ReferenceLine 
            y={300} 
            stroke="#f59e0b" 
            strokeDasharray="3 3"
            label={{ value: 'Ngưỡng tối ưu', position: 'right', fontSize: 10 }}
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
