"use client";

import { useEnergyStats, useEnergySummary, useLatestEnergy } from "@/hooks/energy";
import {
  Activity,
  ChartNoAxesColumn,
  Plug,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface EnergyStatsGridProps {
  mode?: "today" | "24h";
}

interface StatCardProps {
  title: string;
  value: string;
  unit: string;
  subtitle: string;
  icon: React.ReactNode;
  iconColor: string;
  trend?: "up" | "down";
  isLoading?: boolean;
}

interface EnergyPoint {
  power?: number;
  current?: number;
  voltage?: number;
  energy?: number;
}

interface EnergyResponse {
  data?: EnergyPoint[];
}

function EnergyStatCard({
  title,
  value,
  unit,
  subtitle,
  icon,
  iconColor,
  trend,
  isLoading,
}: StatCardProps) {
  if (isLoading) {
    return (
      <div className="section-card shadow-sm border border-border p-4 sm:p-6 animate-pulse">
        <div className="h-20"></div>
      </div>
    );
  }

  return (
    <div className="section-card shadow-sm border border-border p-3 sm:p-4 md:p-6 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4">
        <span className="text-xs sm:text-sm text-muted-foreground">
          {title}
        </span>
        <div className="w-8 h-8 flex items-center justify-center">
          <div style={{ color: iconColor }}>{icon}</div>
        </div>
      </div>
      <div className="mb-2">
        <span className="text-xl sm:text-2xl md:text-4xl font-bold text-foreground">
          {value}
        </span>
        <span className="text-sm sm:text-base md:text-xl text-muted-foreground ml-1">
          {unit}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[11px] sm:text-xs text-muted-foreground">
          {subtitle}
        </span>
        {trend === "up" && <TrendingUp className="w-4 h-4 text-green-500" />}
      </div>
    </div>
  );
}

export default function EnergyStatsGrid({ mode = "24h" }: EnergyStatsGridProps) {
  const { t } = useLanguage();
  const { data: latestRes, isLoading: latestLoading } = useLatestEnergy(5000);
  const { data: statsData, isLoading: statsLoading } = useEnergyStats(24);
  const { data: summaryData, isLoading: summaryLoading } = useEnergySummary();

  const energyData = ((statsData as EnergyResponse | undefined)?.data || []) as EnergyPoint[];
  const latestData = (latestRes as any)?.data || {};
  
  const summary = (summaryData as any)?.data || { todayWh: 0, monthWh: 0 };
  
  // Calculate 24h total from the points list
  const total24hWh = energyData.reduce((sum, item) => sum + (item.energy || 0), 0);

  const isLoading = latestLoading || statsLoading || summaryLoading;

  const stats = [
    {
      title: t("energy.consumption"),
      value: ((latestData.power || 0) / 1000).toFixed(2),
      unit: "W",
      subtitle: t("energy.currentPower"),
      icon: <Zap className="w-5 h-5" />,
      iconColor: "#f59e0b",
      trend: "up" as const,
    },
    {
      title: t("energy.current"),
      value: ((latestData.current || 0) / 1000).toFixed(3),
      unit: "A",
      subtitle: t("energy.currentConsumption"),
      icon: <Activity className="w-5 h-5" />,
      iconColor: "#f97316",
      trend: undefined,
    },
    {
      title: t("energy.voltage"),
      value: (latestData.voltage || 0).toFixed(2),
      unit: "V",
      subtitle: t("energy.outputVoltage"),
      icon: <Plug className="w-5 h-5" />,
      iconColor: "#a855f7",
      trend: undefined,
    },
    {
      title: t("energy.totalEnergy"),
      value: total24hWh.toFixed(3),
      unit: "Wh",
      subtitle: t("energy.last24Hours") + " (Trôi)",
      icon: <ChartNoAxesColumn className="w-5 h-5" />,
      iconColor: "#10b981",
      trend: undefined,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((stat, index) => (
        <EnergyStatCard key={index} {...stat} isLoading={isLoading} />
      ))}
    </div>
  );
}
