'use client';

import { useSensorData } from '@/hooks/useSensors';

interface SensorCurrentData {
  temperature: number;
  humidity: number;
  pressure: number;
  lightLevel: number;
  isDark: boolean;
  isRaining: boolean;
  timestamp: string;
  comfort: string;
}

interface StatCardProps {
  label: string;
  value: string;
  subtitle: string;
  color: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

function SensorStatCard({ label, value, subtitle, color, icon, trend }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
          <p className="text-xs text-gray-400">{subtitle}</p>
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
              <span>{trend.value}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg`} style={{ backgroundColor: color + '20' }}>
          <div style={{ color }}>{icon}</div>
        </div>
      </div>
    </div>
  );
}

export default function SensorStatsGrid() {
  const { data: response, isLoading } = useSensorData(3000);
  const data = (response as any)?.data as SensorCurrentData | undefined; 

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg p-6 border border-gray-200 animate-pulse">
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const stats: StatCardProps[] = [
    {
      label: 'Nhiệt độ',
      value: data?.temperature !== undefined ? `${data.temperature.toFixed(1)}°C` : '--',
      subtitle: 'AHT20 Sensor',
      color: '#ef4444',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      label: 'Độ ẩm',
      value: data?.humidity !== undefined ? `${data.humidity.toFixed(1)}%` : '--',
      subtitle: 'AHT20 Sensor',
      color: '#3b82f6',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
      ),
    },
    {
      label: 'Áp suất',
      value: data?.pressure !== undefined ? `${data.pressure.toFixed(1)} hPa` : '--',
      subtitle: 'BMP280 Sensor',
      color: '#8b5cf6',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat, index) => (
        <SensorStatCard key={index} {...stat} />
      ))}
    </div>
  );
}
