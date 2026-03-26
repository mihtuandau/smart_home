'use client';

import { useEnergyStats, usePowerSources } from '@/hooks/useEnergy';

interface SystemComponent {
  name: string;
  spec: string;
  status: string;
  statusColor: string;
  metric: string;
  value: string;
  valueColor?: string;
}

export default function EnergySystemTable() {
  const { data: energyData, isLoading: energyLoading } = useEnergyStats(24);
  const { data: sourcesData, isLoading: sourcesLoading } = usePowerSources(24);
  
  const latestEnergy = ((energyData as any)?.data || [])[((energyData as any)?.data || []).length - 1] || {};
  const sources = (sourcesData as any)?.data || {};
  
  const totalEnergy = ((energyData as any)?.data || []).reduce((sum: number, item: any) => sum + (item.energy || 0), 0);

  const components: SystemComponent[] = [
    {
      name: 'Solar Panel',
      spec: `${(latestEnergy.voltage || 0).toFixed(1)}V ${(latestEnergy.current || 0).toFixed(1)}A`,
      status: 'Công suất hiện tại',
      statusColor: 'text-foreground',
      metric: `${(latestEnergy.power || 0).toFixed(2)} W`,
      value: `${(latestEnergy.power || 0).toFixed(2)} W`,
      valueColor: 'text-orange-600'
    },
    {
      name: 'Năng lượng thu được',
      spec: 'Hôm nay',
      status: 'Tổng năng lượng',
      statusColor: 'text-green-700',
      metric: `${totalEnergy.toFixed(2)} Wh`,
      value: `${totalEnergy.toFixed(2)} Wh`,
      valueColor: 'text-gray-900'
    },
    {
      name: 'Nguồn điện',
      spec: latestEnergy.source || 'UNKNOWN',
      status: 'Trạng thái',
      statusColor: 'text-blue-700',
      metric: 'Hoạt động',
      value: 'Hoạt động',
      valueColor: 'text-green-700'
    },
    {
      name: 'Hiệu suất',
      spec: 'Hệ thống',
      status: 'Tỷ lệ chuyển đổi',
      statusColor: 'text-foreground',
      metric: '85%',
      value: '85%',
      valueColor: 'text-green-700'
    }
  ];

  if (energyLoading || sourcesLoading) {
    return (
      <div className="section-card shadow-sm border border-border p-4 sm:p-6 animate-pulse">
        <div className="h-64"></div>
      </div>
    );
  }

  return (
    <div className="section-card shadow-sm border border-border p-4 sm:p-6">
      <div className="mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-foreground">Thông tin hệ thống năng lượng</h2>
      </div>

      <div className="space-y-3 md:hidden">
        {components.map((component, index) => (
          <div key={index} className="border border-border rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">{component.name}</span>
              <span className={`text-sm font-bold ${component.valueColor || 'text-foreground'}`}>{component.value}</span>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {component.spec}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{component.status}</div>
          </div>
        ))}
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Phần cứng</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Thông số</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Thông kế hôm nay</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground"></th>
            </tr>
          </thead>
          <tbody>
            {components.map((component, index) => (
                <tr key={index} className="border-b border-border hover:bg-muted transition-colors">
                <td className="py-4 px-4">
                  <span className="text-sm font-medium text-foreground">{component.name}</span>
                </td>
                <td className="py-4 px-4">
                  <span className={`text-sm font-semibold ${component.statusColor}`}>
                    {component.spec}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm text-muted-foreground">{component.status}</span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className={`text-sm font-bold ${component.valueColor || 'text-foreground'}`}>
                    {component.value}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
