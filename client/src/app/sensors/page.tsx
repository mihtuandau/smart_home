'use client';

import SensorStatsGrid from '@/components/sensors/SensorStatsGrid';
import RainProbabilityPredictor from '@/components/sensors/RainProbabilityPredictor';
import TemperatureHumidityChart from '@/components/sensors/TemperatureHumidityChart';
import SensorHistoryTable from '@/components/sensors/SensorHistoryTable';
import { useLanguage } from '@/contexts/LanguageContext';

export default function SensorsPage() {
  const { t } = useLanguage();

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="page-title">{t('sensors.title')}</h1>
        <p className="page-subtitle">{t('sensors.subtitle')}</p>
      </div>

      {/* Sensor Stats Grid */}
      <SensorStatsGrid />

      {/* Rain Probability Predictor */}
      <RainProbabilityPredictor />

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 min-w-0">
        <TemperatureHumidityChart hours={24} />
      </div>

      {/* History Table */}
      <SensorHistoryTable />
    </div>
  );
}
