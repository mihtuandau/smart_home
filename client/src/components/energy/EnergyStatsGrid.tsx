"use client";

import { useEnergyStats } from "@/hooks/useEnergy";

interface StatCardProps {
  title: string;
  value: string;
  unit: string;
  subtitle: string;
  icon: string;
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
      <div className="bg-white rounded-lg p-6 border border-gray-200 animate-pulse">
        <div className="h-20"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-600">{title}</span>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${iconColor}20` }}
        >
          <span className="text-lg">{icon}</span>
        </div>
      </div>
      <div className="mb-2">
        <span className="text-4xl font-bold text-gray-900">{value}</span>
        <span className="text-xl text-gray-500 ml-1">{unit}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">{subtitle}</span>
        {trend === "up" && (
          <svg
            className="w-4 h-4 text-green-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
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
      icon: "☀️",
      iconColor: "#f59e0b",
      trend: "up" as const,
    },
    {
      title: "Dòng điện",
      value: (latestData.current || 0).toFixed(2),
      unit: "A",
      subtitle: "Dòng tiêu thụ",
      icon: "⚡",
      iconColor: "#f97316",
      trend: undefined,
    },
    {
      title: "Điện áp",
      value: (latestData.voltage || 0).toFixed(2),
      unit: "V",
      subtitle: "Điện áp đầu ra",
      icon: "🔌",
      iconColor: "#a855f7",
      trend: undefined,
    },
    {
      title: "Năng lượng",
      value: totalEnergy.toFixed(2),
      unit: "Wh",
      subtitle: "24 giờ qua",
      icon: "📊",
      iconColor: "#10b981",
      trend: undefined,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <EnergyStatCard key={index} {...stat} isLoading={isLoading} />
      ))}
    </div>
  );
}
