'use client';

import StatCard from './StatCard';
import { useLatestDeviceData } from '@/hooks/useDevices';

interface SensorData {
  temperature: number;
  humidity: number;
  voltage: number;
  current_mA: number;
  power_mW: number;
}

export default function StatsGrid() {
  const { data: response, isLoading } = useLatestDeviceData(3000);
  const data = (response as any)?.data;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg p-6 border border-gray-200 animate-pulse">
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const stats = [
    { 
      label: 'Năng lượng mặt trời', 
      value: data ? `${(data.power_mW / 1000).toFixed(1)} W` : '0 W', 
      color: '#f59e0b',
      subtitle: 'Đang phát điện'
    },
    { 
      label: 'Điện áp', 
      value: data ? `${data.voltage.toFixed(2)}V` : '0V', 
      color: '#10b981',
      subtitle: `${data ? (data.current_mA / 1000).toFixed(2) : '0'}A`
    },
    { 
      label: 'Nhiệt độ', 
      value: data ? `${data.temperature.toFixed(1)}°C` : '0°C', 
      color: '#ef4444',
      subtitle: 'AHT20 Sensor'
    },
    { 
      label: 'Độ ẩm', 
      value: data ? `${data.humidity.toFixed(1)}%` : '0%', 
      color: '#3b82f6',
      subtitle: 'AHT20 Sensor'
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} index={index} />
      ))}
    </div>
  );
}
