'use client';

import SensorStatsGrid from '@/components/sensors/SensorStatsGrid';
import TemperatureHumidityChart from '@/components/sensors/TemperatureHumidityChart';
import LightIntensityChart from '@/components/sensors/LightIntensityChart';
import SensorHistoryTable from '@/components/sensors/SensorHistoryTable';

export default function SensorsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Giám sát cảm biến</h1>
        <p className="text-sm text-gray-500 mt-1">Theo dõi nhiệt độ, độ ẩm, ánh sáng và các cảm biến môi trường</p>
      </div>

      {/* Sensor Stats Grid */}
      <SensorStatsGrid />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TemperatureHumidityChart hours={24} />
        <LightIntensityChart hours={24} />
      </div>

      {/* History Table */}
      <SensorHistoryTable />
    </div>
  );
}
