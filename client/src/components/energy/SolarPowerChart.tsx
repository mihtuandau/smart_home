'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SolarPowerChart() {
  // Dữ liệu mẫu theo thời gian
  const data = [
    { time: '01:03', power: 8.2 },
    { time: '02:03', power: 7.8 },
    { time: '03:03', power: 8.0 },
    { time: '04:03', power: 6.5 },
    { time: '05:03', power: 7.2 },
    { time: '06:03', power: 7.8 },
    { time: '07:03', power: 8.4 },
    { time: '08:03', power: 8.8 },
    { time: '09:03', power: 9.2 },
    { time: '10:03', power: 6.8 },
    { time: '11:03', power: 7.5 },
    { time: '12:03', power: 6.9 }
  ];

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Công suất Solar Panel</h2>
        <p className="text-sm text-gray-500">Công suất phát điện theo thời gian</p>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
