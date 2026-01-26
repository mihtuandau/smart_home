'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function LightIntensityChart() {
  const data = [
    { time: '15:17', light: 850 },
    { time: '16:17', light: 920 },
    { time: '17:17', light: 720 },
    { time: '18:17', light: 880 },
    { time: '19:17', light: 760 },
    { time: '20:17', light: 180 },
    { time: '21:17', light: 0 },
    { time: '22:17', light: 0 },
    { time: '23:17', light: 80 },
    { time: '00:17', light: 120 },
    { time: '01:17', light: 20 },
    { time: '01:17', light: 520 },
    { time: '01:17', light: 760 },
    { time: '01:17', light: 780 },
    { time: '01:17', light: 780 },
    { time: '01:17', light: 780 },
    { time: '01:17', light: 750 },
    { time: '01:17', light: 740 },
    { time: '01:17', light: 720 },
    { time: '01:17', light: 740 },
    { time: '01:17', light: 760 },
    { time: '01:17', light: 780 }
  ];

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Cường độ ánh sáng (24h)</h2>
        <p className="text-sm text-gray-500">Dữ liệu từ cảm biến LM393 LDR - Tự động điều khiển đèn và servo</p>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorLight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.6}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
              domain={[0, 1000]}
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              axisLine={{ stroke: '#e5e7eb' }}
              unit=" lx"
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px'
              }}
              cursor={{ fill: 'rgba(245, 158, 11, 0.1)' }}
            />
            <Bar 
              dataKey="light" 
              fill="url(#colorLight)"
              radius={[4, 4, 0, 0]}
              name="Cường độ ánh sáng (lx)"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
