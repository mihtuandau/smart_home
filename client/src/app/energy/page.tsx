"use client";

import EnergyStatsGrid from "@/components/energy/EnergyStatsGrid";
import BatteryStatus from "@/components/energy/BatteryStatus";
import SolarPowerChart from "@/components/energy/SolarPowerChart";
import CurrentVoltageChart from "@/components/energy/CurrentVoltageChart";
import EnergySystemTable from "@/components/energy/EnergySystemTable";

export default function EnergyPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Giám sát năng lượng
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Theo dõi hệ thống năng lượng mặt trời và pin
        </p>
      </div>

      <EnergyStatsGrid />

      <BatteryStatus />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SolarPowerChart />
        <CurrentVoltageChart />
      </div>

      <EnergySystemTable />
    </div>
  );
}
