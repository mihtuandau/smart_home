"use client";

import { useBatteryStatus } from "@/hooks/useEnergy";

export default function BatteryStatus() {
  const { data, isLoading } = useBatteryStatus();

  const batteryData = (data as any)?.data || {};
  const batteryLevel = batteryData.level || 0;
  const voltage = batteryData.voltage
    ? `${batteryData.voltage.toFixed(2)}V`
    : "0.00V";
  const current = batteryData.current
    ? `${batteryData.current.toFixed(2)}A`
    : "0.00A";
  const status = (batteryData.status || "UNKNOWN") as "CHARGING" | "DISCHARGING" | "IDLE" | "UNKNOWN";

  // Determine status in Vietnamese
  const statusText =
    {
      CHARGING: "Đang sạc",
      DISCHARGING: "Đang xả",
      IDLE: "Chờ",
      UNKNOWN: "Không rõ",
    }[status] || "Không rõ";

  const statusColor =
    {
      CHARGING: "bg-green-100 text-green-700",
      DISCHARGING: "bg-orange-100 text-orange-700",
      IDLE: "bg-blue-100 text-blue-700",
      UNKNOWN: "bg-gray-100 text-gray-700",
    }[status] || "bg-gray-100 text-gray-700";

  if (isLoading) {
    return (
      <div className="section-card shadow-sm border border-gray-200 p-4 sm:p-6 animate-pulse">
        <div className="h-40"></div>
      </div>
    );
  }

  return (
    <div className="section-card shadow-sm border border-gray-200 p-4 sm:p-5 md:p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
          <svg
            className="w-5 h-5 text-gray-700"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h6a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h6v10H5V5z"
              clipRule="evenodd"
            />
            <path d="M13 7h2v6h-2V7z" />
          </svg>
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">
            Trạng thái Pin
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            Pin Cell qua CN3791 Solar Charger Module
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
            <span className="text-sm text-gray-600">Mức pin</span>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-bold text-gray-900">
                {batteryLevel}%
              </span>
              <span
                className={`px-2 py-1 rounded-md text-[11px] sm:text-xs font-semibold ${statusColor}`}
              >
                ⚡ {statusText}
              </span>
            </div>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                batteryLevel > 60
                  ? "bg-green-500"
                  : batteryLevel > 30
                    ? "bg-yellow-500"
                    : "bg-red-500"
              }`}
              style={{ width: `${batteryLevel}%` }}
            ></div>
          </div>
        </div>

        {/* Battery Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <p className="text-xs text-gray-600 mb-1">Điện áp</p>
            <p className="text-base sm:text-lg font-bold text-gray-900">{voltage}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Dòng điện</p>
            <p className="text-base sm:text-lg font-bold text-gray-900">{current}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Trạng thái</p>
            <p className="text-base sm:text-lg font-bold text-gray-900">{statusText}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
