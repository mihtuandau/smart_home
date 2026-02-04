'use client';

import StatCard from './StatCard';
import { useLatestDeviceData, useDeviceStats } from '@/hooks/useDevices';
import { useEnergyStats } from '@/hooks/useEnergy';

export default function StatsGrid() {
  const { data: latestResponse, isLoading: latestLoading } = useLatestDeviceData(3000);
  const { data: statsResponse, isLoading: statsLoading } = useDeviceStats();
  const { data: energyResponse, isLoading: energyLoading } = useEnergyStats(24, 5000); // Refetch every 5 seconds

  const latestData = (latestResponse as any)?.data;
  const statsData = (statsResponse as any)?.data;
  
  // Energy response is an array of power data, calculate total
  const energyArray = (energyResponse as any)?.data || [];
  const totalSolarEnergy = energyArray.reduce((sum: number, item: any) => sum + (item.energy || 0), 0);

  const isLoading = latestLoading || statsLoading || energyLoading;

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

  // Get device stats from the response
  const devicesOn = statsData?.online || 0;
  const totalDevices = statsData?.total || 0;

  const stats = [
    { 
      label: 'Thiết bị hoạt động', 
      value: `${devicesOn}/${totalDevices}`, 
      color: '#10b981',
      subtitle: 'Đang bật'
    },
    { 
      label: 'Năng lượng hôm nay', 
      value: `${(totalSolarEnergy / 1000).toFixed(2)} kWh`,
      color: '#f59e0b',
      subtitle: 'Solar power'
    },
    { 
      label: 'Nhiệt độ', 
      value: latestData?.temperature !== undefined ? `${latestData.temperature.toFixed(1)}°C` : '--', 
      color: '#ef4444',
      subtitle: `Độ ẩm: ${latestData?.humidity !== undefined ? latestData.humidity.toFixed(1) : '--'}%`
    },
    { 
      label: 'Điện áp hệ thống', 
      value: latestData?.voltage !== undefined ? `${latestData.voltage.toFixed(2)}V` : '--', 
      color: '#3b82f6',
      subtitle: `${latestData?.current_mA !== undefined ? (latestData.current_mA / 1000).toFixed(2) : '--'}A`
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
