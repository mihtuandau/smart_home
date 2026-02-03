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
import { useSensorData } from '@/hooks/useSensors';

interface LightIntensityChartProps {
  hours?: number;
}

const LightIntensityChart: React.FC<LightIntensityChartProps> = ({ hours = 24 }) => {
  const { data: sensorData, isLoading, error } = useSensorData();

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
  const chartData = [
    { time: '00:00', light: 0 },
    { time: '04:00', light: 0 },
    { time: '06:00', light: 150 },
    { time: '08:00', light: 400 },
    { time: '10:00', light: 650 },
    { time: '12:00', light: 800 },
    { time: '14:00', light: 750 },
    { time: '16:00', light: 500 },
    { time: '18:00', light: 200 },
    { time: '20:00', light: 50 },
    { time: '22:00', light: 0 },
    { time: '24:00', light: 0 },
  ];

  const currentLight = (sensorData as any)?.data?.light || (sensorData as any)?.data?.lightLevel || 0;
  const avgLight = chartData.reduce((sum, item) => sum + item.light, 0) / chartData.length;

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"/>
            </svg>
          </div>
          Cường độ ánh sáng
        </h2>
        <div className="text-sm text-gray-500">
          {hours} giờ qua
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Hiện tại</p>
          <p className="text-lg font-bold text-yellow-600">
            {currentLight} lux
          </p>
        </div>
        <div className="text-center p-3 bg-amber-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Trung bình</p>
          <p className="text-lg font-bold text-amber-600">
            {avgLight.toFixed(0)} lux
          </p>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
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

      {/* Light level indicator */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Tối</span>
          <span className="text-gray-600">Trung bình</span>
          <span className="text-gray-600">Sáng</span>
        </div>
        <div className="mt-2 h-2 bg-gradient-to-r from-gray-800 via-yellow-400 to-yellow-200 rounded-full"></div>
      </div>
    </div>
  );
};

export default LightIntensityChart;
