'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function CurrentVoltageChart() {
  // Dữ liệu mẫu với dòng điện và điện áp
  const data = [
    { time: '01:03', current: 0.8, voltage: 3.6 },
    { time: '02:03', current: 0.9, voltage: 3.55 },
    { time: '03:03', current: 1.2, voltage: 3.5 },
    { time: '04:03', current: 1.0, voltage: 3.58 },
    { time: '05:03', current: 0.95, voltage: 3.62 },
    { time: '06:03', current: 1.1, voltage: 3.6 },
    { time: '07:03', current: 1.15, voltage: 3.65 },
    { time: '08:03', current: 1.3, voltage: 3.7 },
    { time: '09:03', current: 1.4, voltage: 3.68 },
    { time: '10:03', current: 1.25, voltage: 3.62 },
    { time: '11:03', current: 1.35, voltage: 3.66 },
    { time: '12:03', current: 1.1, voltage: 3.64 }
  ];

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Dòng điện & Điện áp Pin</h2>
        <p className="text-sm text-gray-500">Theo dõi dòng và áp qua thời gian</p>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px'
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              iconType="line"
            />
            <Line 
              type="monotone" 
              dataKey="current" 
              stroke="#10b981" 
              strokeWidth={2}
              name="Dòng điện (A)"
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line 
              type="monotone" 
              dataKey="voltage" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="Điện áp (V)"
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
