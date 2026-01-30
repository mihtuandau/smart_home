'use client';

import { useLatestDeviceData } from '@/hooks/useDevices';

export default function DeviceSummary() {
  const { data: response, isLoading } = useLatestDeviceData(3000);
  const data = (response as any)?.data || response;

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="text-center">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const ledCount = (data?.led1 ? 1 : 0) + (data?.led2 ? 1 : 0);
  const servoPosition = data?.servo_angle || 180;
  
  const stats = [
    { label: 'LED đang bật', value: `${ledCount}/2` },
    { label: 'Vị trí Servo', value: `${servoPosition}°` },
    { label: 'Chế độ Servo', value: 'Auto' },
    { label: 'Touch đang chạm', value: '0/4' },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-900 mb-6">Tóm tắt trạng thái thiết bị</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="text-center">
            <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
