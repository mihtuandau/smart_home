'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function PressureChart() {
  const data = [
    { time: '12:17', pressure: 1030 },
    { time: '14:17', pressure: 1016 },
    { time: '16:17', pressure: 1012 },
    { time: '18:17', pressure: 1030 },
    { time: '20:17', pressure: 1024 },
    { time: '22:17', pressure: 1020 },
    { time: '00:17', pressure: 1016 },
    { time: '01:17', pressure: 1014 },
    { time: '01:17', pressure: 1030 },
    { time: '01:17', pressure: 1026 },
    { time: '01:17', pressure: 1020 },
    { time: '01:17', pressure: 1016 }
  ];

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Áp suất khí quyển (24h)</h2>
        <p className="text-sm text-gray-500">Dữ liệu từ cảm biến BMP280</p>
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
              domain={[1000, 1030]}
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              axisLine={{ stroke: '#e5e7eb' }}
              unit=" hPa"
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="pressure" 
              stroke="#a855f7" 
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              name="Áp suất (hPa)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
