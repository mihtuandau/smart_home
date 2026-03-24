"use client";

import { useEnergyStats } from "@/hooks/useEnergy";
import { ChartNoAxesColumn, Plug, Sun, TrendingUp, Zap } from 'lucide-react';

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
      <div className="section-card shadow-sm border border-gray-200 p-4 sm:p-6 animate-pulse">
        <div className="h-20"></div>
      </div>
    );
  }

  return (
    <div className="section-card shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4">
        <span className="text-xs sm:text-sm text-gray-600">{title}</span>
        <div className="w-8 h-8 flex items-center justify-center">
          <div style={{ color: iconColor }}>{icon}</div>
        </div>
      </div>
      <div className="mb-2">
        <span className="text-xl sm:text-2xl md:text-4xl font-bold text-gray-900">{value}</span>
        <span className="text-sm sm:text-base md:text-xl text-gray-500 ml-1">{unit}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[11px] sm:text-xs text-gray-500">{subtitle}</span>
        {trend === "up" && (
          <TrendingUp className="w-4 h-4 text-green-500" />
        )}
      </div>
    </div>
  );
}

export default function EnergyStatsGrid() {
  const { data, isLoading } = useEnergyStats(24);

  const energyData = (data as any)?.data || [];
  const latestData = energyData[energyData.length - 1] || {};

  const totalEnergy = energyData.reduce(
    (sum: number, item: any) => sum + (item.energy || 0),
    0,
  );
  const avgPower =
    energyData.length > 0
      ? energyData.reduce(
          (sum: number, item: any) => sum + (item.power || 0),
          0,
        ) / energyData.length
      : 0;

  const stats = [
    {
      title: "Solar Panel",
      value: (latestData.power || 0).toFixed(2),
      unit: "W",
      subtitle: "Công suất hiện tại",
      icon: <Sun className="w-5 h-5" />,
      iconColor: "#f59e0b",
      trend: "up" as const,
    },
    {
      title: "Dòng điện",
      value: (latestData.current || 0).toFixed(2),
      unit: "A",
      subtitle: "Dòng tiêu thụ",
      icon: <Zap className="w-5 h-5" />,
      iconColor: "#f97316",
      trend: undefined,
    },
    {
      title: "Điện áp",
      value: (latestData.voltage || 0).toFixed(2),
      unit: "V",
      subtitle: "Điện áp đầu ra",
      icon: <Plug className="w-5 h-5" />,
      iconColor: "#a855f7",
      trend: undefined,
    },
    {
      title: "Năng lượng",
      value: totalEnergy.toFixed(2),
      unit: "Wh",
      subtitle: "24 giờ qua",
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
