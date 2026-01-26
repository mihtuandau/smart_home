'use client';

import OledDisplay from '@/components/sensors/OledDisplay';
import SensorStatsGrid from '@/components/sensors/SensorStatsGrid';
import EnvironmentStatus from '@/components/sensors/EnvironmentStatus';
import TempHumidityChart from '@/components/sensors/TempHumidityChart';
import PressureChart from '@/components/sensors/PressureChart';
import LightIntensityChart from '@/components/sensors/LightIntensityChart';
import SensorInfoTable from '@/components/sensors/SensorInfoTable';

export default function SensorsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Giám sát cảm biến</h1>
        <p className="text-sm text-gray-500 mt-1">Theo dõi các thông số môi trường từ cảm biến</p>
      </div>

      {/* OLED Display */}
      <OledDisplay />

      {/* Sensor Stats */}
      <SensorStatsGrid />

      {/* Environment Status */}
      <EnvironmentStatus />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TempHumidityChart />
        <PressureChart />
      </div>

      {/* Light Intensity Chart */}
      <LightIntensityChart />

      {/* Sensor Info Table */}
      <SensorInfoTable />
    </div>
  );
}
