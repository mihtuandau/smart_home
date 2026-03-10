'use client';

import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useEnergyStats } from '@/hooks/useEnergy';

interface EnergyChartProps {
  hours?: number;
}

const transformEnergyData = (data: any[], hours: number) => {
  if (!data || data.length === 0) return [];
  
  const slots: Array<{ timestamp: Date; hour: number; data: any[] }> = [];
  const now = new Date();
  const hoursToShow = Math.min(hours, 24);
  
  for (let i = hoursToShow - 1; i >= 0; i--) {
    const slotTime = new Date(now.getTime() - i * 60 * 60 * 1000);
    slotTime.setMinutes(0, 0, 0);
    slots.push({
      timestamp: slotTime,
      hour: slotTime.getHours(),
      data: [],
    });
  }
  
  data.forEach((item) => {
    const itemDate = new Date(item.timestamp);
    const itemHour = itemDate.getHours();
    
    const slot = slots.find(s => s.hour === itemHour);
    if (slot) {
      slot.data.push(item);
    }
  });
  
  return slots.map(slot => {
    if (slot.data.length === 0) {
      return {
        time: slot.timestamp.toLocaleTimeString('vi-VN', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        consumption: 0,
        timestamp: slot.timestamp,
      };
    }
    
    const avg = slot.data.reduce((sum: number, item: any) => sum + (item.energy || item.power || 0), 0) / slot.data.length;
    
    return {
      time: slot.timestamp.toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      consumption: Math.round(avg * 100) / 100,
      timestamp: slot.timestamp,
    };
  });
};

const EnergyChart: React.FC<EnergyChartProps> = ({ hours = 24 }) => {
  const { data, isLoading, error } = useEnergyStats(hours);

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
        <p className="text-red-600">Không thể tải dữ liệu năng lượng</p>
        <p className="text-xs text-gray-500 mt-2">{error.message}</p>
      </div>
    );
  }

  const rawData = (data as any)?.data || [];
  const hasData = rawData.length > 0;
  
  const chartData = hasData ? transformEnergyData(rawData, hours) : [];
  
  const totalConsumption = rawData.reduce((sum: number, item: any) => sum + (item.energy || 0), 0);
  const avgConsumption = hasData ? totalConsumption / rawData.length : 0;
  const peakConsumption = hasData ? Math.max(...rawData.map((item: any) => item.energy || 0)) : 0;
  
  return (
    <div className="bg-white rounded-lg p-4 md:p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Biểu đồ Năng lượng</h2>
        <div className="text-sm text-gray-500">
          {hours} giờ qua
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Tổng tiêu thụ</p>
          <p className="text-lg font-bold text-blue-600">
            {totalConsumption.toFixed(2)} Wh
          </p>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Trung bình</p>
          <p className="text-lg font-bold text-green-600">
            {avgConsumption.toFixed(2)} Wh
          </p>
        </div>
        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Cao nhất</p>
          <p className="text-lg font-bold text-orange-600">
            {peakConsumption.toFixed(2)} Wh
          </p>
        </div>
      </div>

      {hasData ? (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="time" 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            interval={2}
            tick={{ fill: '#9ca3af' }}
          />
          <YAxis 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            label={{ value: 'Wh', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }}
            tick={{ fill: '#9ca3af' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              fontSize: '12px'
            }}
            formatter={(value: number | undefined) => [`${value?.toFixed(2) || '0'} Wh`, 'Năng lượng']}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="consumption"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#colorEnergy)"
            name="Tiêu thụ điện"
            dot={false}
            activeDot={{ r: 5, fill: '#3b82f6' }}
          />
        </AreaChart>
      </ResponsiveContainer>
      ) : (
        <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-gray-500 font-medium">Chưa có dữ liệu năng lượng</p>
            <p className="text-xs text-gray-400 mt-1">Dữ liệu sẽ xuất hiện khi hệ thống bắt đầu thu thập</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnergyChart;
