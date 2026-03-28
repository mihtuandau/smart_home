"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import EnergyStatsGrid from "@/components/energy/EnergyStatsGrid";
// import BatteryStatus from "@/components/energy/BatteryStatus";
import SolarPowerChart from "@/components/energy/SolarPowerChart";
import CurrentVoltageChart from "@/components/energy/CurrentVoltageChart";
import EnergySystemTable from "@/components/energy/EnergySystemTable";

export default function EnergyPage() {
  const { t } = useLanguage();

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="page-title">{t('energy.title')}</h1>
        <p className="page-subtitle">
          {t('energy.subtitle')}
        </p>
      </div>

      <EnergyStatsGrid />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <SolarPowerChart />
        <CurrentVoltageChart />
      </div>

      <EnergySystemTable />
    </div>
  );
}
