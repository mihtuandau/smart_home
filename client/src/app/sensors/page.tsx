'use client';

import SensorStatsGrid from '@/components/sensors/SensorStatsGrid';
import RainProbabilityPredictor from '@/components/sensors/RainProbabilityPredictor';
import TemperatureHumidityChart from '@/components/sensors/TemperatureHumidityChart';
import SensorHistoryTable from '@/components/sensors/SensorHistoryTable';

export default function SensorsPage() {
  return (
    <div className="space-y-4 sm:space-y-6 min-w-0">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="page-title">Giám sát cảm biến</h1>
        <p className="page-subtitle">Theo dõi nhiệt độ, độ ẩm và các cảm biến môi trường</p>
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
