'use client';

import { useEnergyStats, usePowerSources } from '@/hooks/energy';
import { useLanguage } from '@/contexts/LanguageContext';

interface SystemComponent {
  name: string;
  spec: string;
  status: string;
  statusColor: string;
  metric: string;
  value: string;
  valueColor?: string;
}

interface EnergyPoint {
  voltage?: number;
  current?: number;
  power?: number;
  energy?: number;
  source?: string;
}

interface EnergyResponse {
  data?: EnergyPoint[];
}

function localizePowerSource(source: string | undefined, t: (key: string) => string): string {
  if (!source) return 'UNKNOWN';
  const normalized = source.toUpperCase();
  if (normalized === 'SOLAR') return t('energy.solarPower');
  if (normalized === 'BATTERY') return t('energy.batteryStatus');
  return source;
}

export default function EnergySystemTable() {
  const { t } = useLanguage();
  const { data: energyData, isLoading: energyLoading } = useEnergyStats(24);
  const { isLoading: sourcesLoading } = usePowerSources(24);

  const energyRows = ((energyData as EnergyResponse | undefined)?.data || []) as EnergyPoint[];
  const latestEnergy = energyRows[energyRows.length - 1] || {};

  const totalEnergy = energyRows.reduce((sum: number, item) => sum + (item.energy || 0), 0);

  const components: SystemComponent[] = [
    {
      name: t('energy.solarPower'),
      spec: `${(latestEnergy.voltage || 0).toFixed(1)}V ${(latestEnergy.current || 0).toFixed(1)}A`,
      status: t('energy.currentPower'),
      statusColor: 'text-foreground',
      metric: `${(latestEnergy.power || 0).toFixed(2)} W`,
      value: `${(latestEnergy.power || 0).toFixed(2)} W`,
      valueColor: 'text-orange-600'
    },
    {
      name: t('energy.harvestedEnergy'),
      spec: t('energy.today'),
      status: t('energy.totalEnergy'),
      statusColor: 'text-green-700',
      metric: `${totalEnergy.toFixed(2)} Wh`,
      value: `${totalEnergy.toFixed(2)} Wh`,
      valueColor: 'text-gray-900'
    },
    {
      name: t('energy.powerSource'),
      spec: localizePowerSource(latestEnergy.source, t),
      status: t('devices.status'),
      statusColor: 'text-blue-700',
      metric: t('energy.active'),
      value: t('energy.active'),
      valueColor: 'text-green-700'
    },
    {
      name: t('energy.efficiency'),
      spec: t('energy.system'),
      status: t('energy.conversionRate'),
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
        <h2 className="text-base sm:text-lg font-semibold text-foreground">{t('energy.systemInfo')}</h2>
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
              <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">{t('energy.hardware')}</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">{t('energy.spec')}</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">{t('energy.todayStats')}</th>
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
