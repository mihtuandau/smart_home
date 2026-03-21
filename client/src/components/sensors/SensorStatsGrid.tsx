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
  color: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

function SensorStatCard({ label, value, color, icon, trend }: StatCardProps) {
  return (
    <div className="section-card shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6 hover:shadow-md md:hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-3 md:items-start md:justify-between md:gap-0">
        <div className="order-1 md:order-2 p-2 md:p-2.5 rounded-lg flex-shrink-0" style={{ backgroundColor: color + '18' }}>
          <div className="w-5 h-5 md:w-6 md:h-6" style={{ color }}>{icon}</div>
        </div>

        <div className="order-2 md:order-1 flex-1 min-w-0">
          <p className="text-[11px] sm:text-xs md:text-sm font-medium text-gray-500 mb-0.5 md:mb-1 truncate">{label}</p>
          <p className="text-lg sm:text-xl md:text-3xl font-bold text-gray-900 leading-tight">{value}</p>
          {trend && (
            <div className={`flex items-center gap-1 mt-1 md:mt-2 text-[11px] sm:text-xs md:text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
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
      </div>
    </div>
  );
}

export default function SensorStatsGrid() {
  const { data: response, isLoading } = useSensorData(3000);
  const data = (response as any)?.data as SensorCurrentData | undefined; 

  const formatNumber = (value: unknown, digits: number) => {
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed.toFixed(digits) : '--';
  };

  const formatWithUnit = (value: unknown, digits: number, unit: string) => {
    const formatted = formatNumber(value, digits);
    return formatted === '--' ? '--' : `${formatted}${unit}`;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="section-card shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6 animate-pulse">
            <div className="h-14 md:h-24 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const stats: StatCardProps[] = [
    {
      label: 'Nhiệt độ',
      value: formatWithUnit(data?.temperature, 1, '°C'),
      color: '#ef4444',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      label: 'Độ ẩm',
      value: formatWithUnit(data?.humidity, 1, '%'),
      color: '#3b82f6',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
      ),
    },
    {
      label: 'Áp suất',
      value: formatWithUnit(data?.pressure, 1, ' hPa'),
      color: '#8b5cf6',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {stats.map((stat, index) => (
        <SensorStatCard key={index} {...stat} />
      ))}
    </div>
  );
}
