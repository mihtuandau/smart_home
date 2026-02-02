'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useSolarStats } from '@/hooks/useEnergy';

export default function SolarPowerChart() {
  const { data, isLoading } = useSolarStats(24);
  
  const rawData = (data as any)?.data;
  const solarDataFromAPI = rawData?.data || [];
  
  const mockData = solarDataFromAPI.length === 0 ? [
    { timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(), power: 12.5 },
    { timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(), power: 15.3 },
    { timestamp: new Date(Date.now() - 17 * 60 * 60 * 1000).toISOString(), power: 18.7 },
    { timestamp: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(), power: 22.1 },
    { timestamp: new Date(Date.now() - 11 * 60 * 60 * 1000).toISOString(), power: 25.8 },
    { timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), power: 28.4 },
    { timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), power: 24.6 },
    { timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), power: 18.2 },
    { timestamp: new Date().toISOString(), power: 10.5 },
  ] : [];
  
  const solarData = solarDataFromAPI.length > 0 ? solarDataFromAPI : mockData;
  
  const chartData = solarData.map((item: any) => ({
    time: new Date(item.timestamp).toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    power: item.power || 0,
  }));

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200 animate-pulse">
        <div className="h-64"></div>
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
