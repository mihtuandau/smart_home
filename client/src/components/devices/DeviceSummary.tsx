'use client';

import { useLatestDeviceData } from '@/hooks/useDevices';

export default function DeviceSummary() {
  const { data: response, isLoading } = useLatestDeviceData(3000);
  const data = (response as any)?.data || response;

  if (isLoading) {
    return (
      <div className="section-card shadow-sm border border-border p-4 sm:p-6 animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3 mb-6"></div>
        <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="text-center">
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-8 bg-muted rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const ledCount = (data?.led1 ? 1 : 0) + (data?.led2 ? 1 : 0);
  
  const stats = [
    { label: 'LED đang bật', value: `${ledCount}/2` },
    { label: 'Touch đang chạm', value: '0/4' },
  ];

  return (
    <div className="section-card shadow-sm border border-border p-4 sm:p-6">
      <h3 className="text-sm sm:text-base font-semibold text-foreground mb-4 sm:mb-6">Tóm tắt trạng thái thiết bị</h3>
      
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="text-center">
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">{stat.label}</p>
            <p className="text-xl sm:text-2xl font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
