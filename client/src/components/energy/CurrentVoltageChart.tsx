"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useEnergyStats } from "@/hooks/useEnergy";

export default function CurrentVoltageChart() {
  const { data, isLoading } = useEnergyStats(24);

  const energyData = (data as any)?.data || [];

  const createHourlySlots = () => {
    const slots: Array<{ timestamp: string; hour: number; data: any[] }> = [];
    const now = new Date();

    for (let i = 23; i >= 0; i--) {
      const slotTime = new Date(now.getTime() - i * 60 * 60 * 1000);
      slotTime.setMinutes(0, 0, 0);
      slots.push({
        timestamp: slotTime.toISOString(),
        hour: slotTime.getHours(),
        data: [] as any[],
      });
    }
    return slots;
  };

  const hourlySlots = createHourlySlots();

  energyData.forEach((item: any) => {
    const itemDate = new Date(item.timestamp);
    const itemHour = itemDate.getHours();

    const slot = hourlySlots.find((s) => s.hour === itemHour);
    if (slot) {
      slot.data.push(item);
    }
  });

  const chartData = hourlySlots.map((slot) => {
    if (slot.data.length === 0) {
      return {
        time: new Date(slot.timestamp).toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        current: 0,
        voltage: 0,
      };
    }

    const avgCurrent =
      slot.data.reduce(
        (sum: number, item: any) => sum + (item.current || 0),
        0,
      ) / slot.data.length;
    const avgVoltage =
      slot.data.reduce(
        (sum: number, item: any) => sum + (item.voltage || 0),
        0,
      ) / slot.data.length;

    return {
      time: new Date(slot.timestamp).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      current: avgCurrent,
      voltage: avgVoltage,
    };
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200 animate-pulse">
        <div className="h-64"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4 md:p-6 border border-gray-200">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Dòng điện & Điện áp Pin
        </h2>
        <p className="text-sm text-gray-500">
          Theo dõi dòng và áp qua thời gian
        </p>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 30, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 12, fill: "#9ca3af" }}
              axisLine={{ stroke: "#e5e7eb" }}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 12, fill: "#10b981" }}
              axisLine={{ stroke: "#10b981" }}
              label={{
                value: "Dòng điện (A)",
                angle: -90,
                position: "insideLeft",
                style: { fontSize: 12, fill: "#10b981" },
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12, fill: "#3b82f6" }}
              axisLine={{ stroke: "#3b82f6" }}
              label={{
                value: "Điện áp (V)",
                angle: 90,
                position: "insideRight",
                style: { fontSize: 12, fill: "#3b82f6" },
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
              iconType="line"
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="current"
              stroke="#10b981"
              strokeWidth={2}
              name="Dòng điện (A)"
              dot={false}
              activeDot={{ r: 5 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="voltage"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Điện áp (V)"
              dot={false}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
