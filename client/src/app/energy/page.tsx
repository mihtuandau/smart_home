"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import EnergyStatsGrid from "@/components/energy/EnergyStatsGrid";
import SolarPowerChart from "@/components/energy/SolarPowerChart";
import CurrentVoltageChart from "@/components/energy/CurrentVoltageChart";
import EnergySystemTable from "@/components/energy/EnergySystemTable";
import BillingForecastWidget from "@/components/energy/BillingForecastWidget";

export default function EnergyPage() {
  const { t } = useLanguage();
  const [timeRange, setTimeRange] = useState<number>(24);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-1">
        <h1 className="page-title">{t('energy.title')}</h1>
        <p className="page-subtitle">
          {t('energy.subtitle')}
        </p>
      </div>

      <EnergyStatsGrid />

      <div className="flex justify-end items-center">
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(Number(e.target.value))}
          className="text-xs sm:text-sm border border-border bg-background rounded-md px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer max-w-fit shadow-sm"
        >
          <option value={6}>{t('sensors.lastHours').replace('{hours}', '6')}</option>
          <option value={12}>{t('sensors.lastHours').replace('{hours}', '12')}</option>
          <option value={24}>{t('sensors.lastHours').replace('{hours}', '24')}</option>
          <option value={72}>{t('sensors.lastDays').replace('{days}', '3')}</option>
          <option value={168}>{t('sensors.lastDays').replace('{days}', '7')}</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <SolarPowerChart timeRange={timeRange} />
        <CurrentVoltageChart timeRange={timeRange} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        <BillingForecastWidget />
      </div>

      <EnergySystemTable />
    </div>
  );
}
