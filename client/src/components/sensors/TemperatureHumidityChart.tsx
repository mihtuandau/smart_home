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

interface TemperatureHumidityChartProps {
  hours?: number;
}

const TemperatureHumidityChart: React.FC<TemperatureHumidityChartProps> = ({ hours = 24 }) => {
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
        <p className="text-red-600">Không thể tải dữ liệu nhiệt độ & độ ẩm</p>
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
      temperature: item.temperature,
      humidity: item.humidity,
      timestamp: item.timestamp,
    }));

  // If no history data, show placeholder message
  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" clipRule="evenodd"/>
            </svg>
          </div>
          Nhiệt độ & Độ ẩm
        </h2>
        <p className="text-gray-500 text-center py-8">Không có dữ liệu lịch sử</p>
      </div>
    );
  }

  const currentTemp = ((currentResponse as any)?.data?.temperature || 0);
  const currentHumidity = ((currentResponse as any)?.data?.humidity || 0);
  
  const avgTemp = chartData.reduce((sum, item) => sum + item.temperature, 0) / chartData.length;
  const avgHumidity = chartData.reduce((sum, item) => sum + item.humidity, 0) / chartData.length;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-xs font-semibold text-gray-700 mb-2">{payload[0].payload.time}</p>
          <p className="text-xs text-blue-600 flex items-center gap-1">
            <span className="inline-block w-3 h-3 bg-blue-500 rounded-full"></span>
            Độ ẩm: {payload[0].value}%
          </p>
          <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
            <span className="inline-block w-3 h-3 bg-red-500 rounded-full"></span>
            Nhiệt độ: {payload[1].value}°C
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" clipRule="evenodd"/>
            </svg>
          </div>
          Nhiệt độ & Độ ẩm
        </h2>
        <p className="text-sm text-gray-500 mt-1">{hours} giờ qua</p>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={chartData}>
          <defs>
            <linearGradient id="colorHumidity" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="time" 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            yAxisId="left"
            stroke="#ef4444"
            style={{ fontSize: '12px' }}
            label={{ value: '°C', angle: -90, position: 'insideLeft' }}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            stroke="#3b82f6"
            style={{ fontSize: '12px' }}
            label={{ value: '%', angle: 90, position: 'insideRight' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Area
            yAxisId="right"
            type="natural"
            dataKey="humidity"
            fill="url(#colorHumidity)"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
            name="Độ ẩm (%)"
          />
          <Line
            yAxisId="left"
            type="natural"
            dataKey="temperature"
            stroke="#ef4444"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6, fill: '#ef4444' }}
            name="Nhiệt độ (°C)"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TemperatureHumidityChart;
