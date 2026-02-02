'use client';

import { useSensors } from '@/hooks/useSensors';


interface SensorCardProps {
  title: string;
  value: string;
  badge?: string;
  badgeColor?: string;
  borderColor: string;
  bgColor: string;
  icon: string;
}

function SensorCard({ title, value, badge, badgeColor, borderColor, bgColor, icon }: SensorCardProps) {
  return (
    <div 
      className="rounded-lg p-5 border transition-shadow hover:shadow-sm"
      style={{ backgroundColor: bgColor, borderColor: borderColor }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{icon}</span>
        <span className="text-sm font-semibold text-gray-700">{title}</span>
      </div>
      <h3 className="text-3xl font-bold text-gray-900 mb-3">{value}</h3>
      {badge && (
        <span className={`inline-block px-3 py-1 rounded-md text-xs font-semibold ${badgeColor || 'bg-black text-white'}`}>
          {badge}
        </span>
      )}
    </div>
  );
}

interface PressureCardProps {
  title: string;
  subtitle: string;
  value: string;
  status: string;
  borderColor: string;
  bgColor: string;
  icon: string;
}

function PressureCard({ title, subtitle, value, status, borderColor, bgColor, icon }: PressureCardProps) {
  return (
    <div 
      className="rounded-lg p-5 border"
      style={{ backgroundColor: bgColor, borderColor: borderColor }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{icon}</span>
            <span className="text-sm font-semibold text-gray-700">{title}</span>
          </div>
          <p className="text-xs text-gray-600 mb-2">{subtitle}</p>
          <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-600 mb-2">Trạng thái</p>
          <span className="inline-block px-3 py-1 rounded-md text-xs font-semibold bg-green-100 text-green-700">
            {status}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function EnvironmentStatus() {
  const { data: response, isLoading } = useSensors(1, 3000); 
  const data = (response as any)?.data?.[0] || null;

  if (isLoading || !data) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200 animate-pulse">
        <div className="h-40 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Trạng thái môi trường</h2>
        <p className="text-sm text-gray-500 mt-1">Thông tin từ các cảm biến và thiết bị</p>
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SensorCard 
            title="Ánh sáng (LDR)"
            value={`${data.lightLevel} lx`}
            badge={data.isDark ? 'Ban đêm' : 'Ban ngày'}
            badgeColor={data.isDark ? 'bg-gray-800 text-white' : 'bg-yellow-100 text-yellow-800'}
            borderColor="#eab308"
            bgColor="#fef9c3"
            icon="☀️"
          />
          <SensorCard 
            title="Mưa"
            value={data.isRaining ? 'Có mưa' : 'Không mưa'}
            badge={data.isRaining ? 'Servo: Đóng' : 'Servo: Mở'}
            badgeColor={data.isRaining ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}
            borderColor="#3b82f6"
            bgColor="#dbeafe"
            icon="🌧️"
          />
        </div>
        
        <PressureCard 
          title="Áp suất khí quyển (BMP280)"
          subtitle="Áp suất hiện tại"
          value={`${data.pressure.toFixed(2)} hPa`}
          status="Ổn định"
          borderColor="#a855f7"
          bgColor="#f3e8ff"
          icon="🌡️"
        />
      </div>
    </div>
  );
}
