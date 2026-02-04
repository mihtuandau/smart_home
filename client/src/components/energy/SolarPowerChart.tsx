'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useSolarStats } from '@/hooks/useEnergy';

export default function SolarPowerChart() {
  const { data, isLoading } = useSolarStats(24);
  
  // Server returns { success, period, data: { totalGenerated, peakPower, averagePower, data: [...] } }
  const solarDataFromAPI = Array.isArray((data as any)?.data?.data) ? (data as any).data.data : [];
  
  const chartData = solarDataFromAPI.map((item: any) => {
    const timestamp = typeof item.timestamp === 'string' 
      ? new Date(item.timestamp) 
      : item.timestamp;
    
    return {
      time: timestamp.toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      power: item.power || 0,
    };
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200 animate-pulse">
        <div className="h-64"></div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Công suất Solar Panel</h2>
          <p className="text-sm text-gray-500">Công suất phát điện theo thời gian</p>
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-gray-500 font-medium">Chưa có dữ liệu Solar Panel</p>
            <p className="text-xs text-gray-400 mt-1">Dữ liệu sẽ xuất hiện khi hệ thống bắt đầu thu thập</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Công suất Solar Panel</h2>
        <p className="text-sm text-gray-500">Công suất phát điện theo thời gian</p>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPower" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              axisLine={{ stroke: '#e5e7eb' }}
              unit="W"
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px'
              }}
              labelStyle={{ color: '#6b7280', fontWeight: 600 }}
            />
            <Area 
              type="monotone" 
              dataKey="power" 
              stroke="#f59e0b" 
              strokeWidth={2}
              fill="url(#colorPower)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
