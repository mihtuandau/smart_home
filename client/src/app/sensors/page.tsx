'use client';

import SensorStatsGrid from '@/components/sensors/SensorStatsGrid';
import RainProbabilityPredictor from '@/components/sensors/RainProbabilityPredictor';
import TemperatureHumidityChart from '@/components/sensors/TemperatureHumidityChart';
import SensorHistoryTable from '@/components/sensors/SensorHistoryTable';

export default function SensorsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Giám sát cảm biến</h1>
        <p className="text-sm text-gray-500 mt-1">Theo dõi nhiệt độ, độ ẩm và các cảm biến môi trường</p>
      </div>

      {/* Sensor Stats Grid */}
      <SensorStatsGrid />

      {/* Rain Probability Predictor */}
      <RainProbabilityPredictor />

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6">
        <TemperatureHumidityChart hours={24} />
      </div>

      {/* History Table */}
      <SensorHistoryTable />
    </div>
  );
}
