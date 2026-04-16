'use client';

import SensorStatsGrid from '@/components/sensors/SensorStatsGrid';
import RainForecastCard from '@/components/dashboard/RainForecastCard';
import TemperatureHumidityChart from '@/components/sensors/TemperatureHumidityChart';
import SensorHistoryTable from '@/components/sensors/SensorHistoryTable';
import { useLanguage } from '@/contexts/LanguageContext';


export default function SensorsPage() {
  const { t } = useLanguage();

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0">

      <div className="space-y-1">
        <h1 className="page-title">{t('sensors.title')}</h1>
        <p className="page-subtitle">{t('sensors.subtitle')}</p>
      </div>

      <SensorStatsGrid />

      <RainForecastCard />

      <div className="grid grid-cols-1 gap-4 sm:gap-6 min-w-0">
        <TemperatureHumidityChart hours={24} />
      </div>

      <SensorHistoryTable />
    </div>
  );
}
