'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function TempHumidityChart() {
  const data = [
    { time: '12:17', temp: 26, humidity: 62 },
    { time: '14:17', temp: 24, humidity: 58 },
    { time: '16:17', temp: 22, humidity: 54 },
    { time: '18:17', temp: 28, humidity: 68 },
    { time: '20:17', temp: 30, humidity: 72 },
    { time: '22:17', temp: 28, humidity: 65 },
    { time: '00:17', temp: 26, humidity: 60 },
    { time: '01:17', temp: 25, humidity: 58 },
    { time: '01:17', temp: 27, humidity: 63 },
    { time: '01:17', temp: 29, humidity: 70 },
    { time: '01:17', temp: 28, humidity: 66 },
    { time: '01:17', temp: 27, humidity: 64 }
  ];

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Nhiệt độ & Độ ẩm (24h)</h2>
        <p className="text-sm text-gray-500">Dữ liệu từ cảm biến AHT20</p>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorHumidity" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
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
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="temp" 
              stroke="#ef4444" 
              strokeWidth={2}
              fill="url(#colorTemp)" 
              name="Nhiệt độ (°C)"
            />
            <Area 
              type="monotone" 
              dataKey="humidity" 
              stroke="#3b82f6" 
              strokeWidth={2}
              fill="url(#colorHumidity)" 
              name="Độ ẩm (%)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
