'use client';

import StatCard from './StatCard';

export default function StatsGrid() {
  const stats = [
    { 
      label: 'Năng lượng mặt trời', 
      value: '8.6 W', 
      color: '#f59e0b',
      subtitle: 'Đang phát điện'
    },
    { 
      label: 'Pin Cell', 
      value: '75%', 
      color: '#10b981',
      progress: 75
    },
    { 
      label: 'Nhiệt độ', 
      value: '26.5°C', 
      color: '#ef4444',
      subtitle: 'AHT20 Sensor'
    },
    { 
      label: 'Độ ẩm', 
      value: '65%', 
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
