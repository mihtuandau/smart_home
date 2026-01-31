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
import { useSensorData } from '@/hooks/useSensors';

interface TemperatureHumidityChartProps {
  hours?: number;
}

const TemperatureHumidityChart: React.FC<TemperatureHumidityChartProps> = ({ hours = 24 }) => {
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
        <p className="text-red-600">Không thể tải dữ liệu nhiệt độ & độ ẩm</p>
      </div>
    );
  }

  // Mock data - replace with real API data
  const chartData = [
    { time: '00:00', temperature: 24, humidity: 65 },
    { time: '02:00', temperature: 23, humidity: 68 },
    { time: '04:00', temperature: 22, humidity: 70 },
    { time: '06:00', temperature: 23, humidity: 68 },
    { time: '08:00', temperature: 25, humidity: 62 },
    { time: '10:00', temperature: 27, humidity: 58 },
    { time: '12:00', temperature: 29, humidity: 55 },
    { time: '14:00', temperature: 30, humidity: 53 },
    { time: '16:00', temperature: 29, humidity: 54 },
    { time: '18:00', temperature: 27, humidity: 58 },
    { time: '20:00', temperature: 26, humidity: 60 },
    { time: '22:00', temperature: 25, humidity: 63 },
  ];

  const currentTemp = (sensorData as any)?.data?.temperature || 0;
  const currentHumidity = (sensorData as any)?.data?.humidity || 0;
  
  const avgTemp = chartData.reduce((sum, item) => sum + item.temperature, 0) / chartData.length;
  const avgHumidity = chartData.reduce((sum, item) => sum + item.humidity, 0) / chartData.length;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-xs font-semibold text-gray-700 mb-2">{payload[0].payload.time}</p>
          <p className="text-xs text-red-600 flex items-center gap-1">
            <span className="inline-block w-3 h-3 bg-red-500 rounded-full"></span>
            Nhiệt độ: {payload[0].value}°C
          </p>
          <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
            <span className="inline-block w-3 h-3 bg-blue-500 rounded-full"></span>
            Độ ẩm: {payload[1].value}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" clipRule="evenodd"/>
            </svg>
          </div>
          Nhiệt độ & Độ ẩm
        </h2>
        <div className="text-sm text-gray-500">
          {hours} giờ qua
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Nhiệt độ</p>
          <p className="text-lg font-bold text-red-600">
            {currentTemp}°C
          </p>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Độ ẩm</p>
          <p className="text-lg font-bold text-blue-600">
            {currentHumidity}%
          </p>
        </div>
        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">TB Nhiệt độ</p>
          <p className="text-lg font-bold text-orange-600">
            {avgTemp.toFixed(1)}°C
          </p>
        </div>
        <div className="text-center p-3 bg-cyan-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">TB Độ ẩm</p>
          <p className="text-lg font-bold text-cyan-600">
            {avgHumidity.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
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
            type="monotone"
            dataKey="humidity"
            fill="url(#colorHumidity)"
            stroke="#3b82f6"
            strokeWidth={2}
            name="Độ ẩm (%)"
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="temperature"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ fill: '#ef4444', r: 4 }}
            activeDot={{ r: 6 }}
            name="Nhiệt độ (°C)"
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Comfort level indicator */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs font-semibold text-gray-600 mb-2">Nhiệt độ tối ưu</p>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>18°C</span>
            <span className="font-medium text-green-600">20-26°C</span>
            <span>32°C</span>
          </div>
          <div className="mt-1 h-2 bg-gradient-to-r from-blue-400 via-green-400 to-red-400 rounded-full"></div>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs font-semibold text-gray-600 mb-2">Độ ẩm tối ưu</p>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>30%</span>
            <span className="font-medium text-green-600">40-60%</span>
            <span>80%</span>
          </div>
          <div className="mt-1 h-2 bg-gradient-to-r from-orange-400 via-blue-400 to-cyan-400 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default TemperatureHumidityChart;
