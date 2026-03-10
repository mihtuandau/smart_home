'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sensorsApi } from '@/lib/api/sensors';
import { energyApi } from '@/lib/api/energy';

type Period = '24h' | '7d' | '30d';

const periodHours: Record<Period, number> = {
  '24h': 24,
  '7d': 168,
  '30d': 720,
};

export default function ReportGenerator() {
  const [period, setPeriod] = useState<Period>('24h');
  const hours = periodHours[period];

  const { data: sensorStats, isLoading: sensorLoading } = useQuery({
    queryKey: ['report-sensor-stats', hours],
    queryFn: () => sensorsApi.getSensorStats(hours),
  });

  const { data: energyStats, isLoading: energyLoading } = useQuery({
    queryKey: ['report-energy-stats', hours],
    queryFn: () => energyApi.getEnergyStats(hours),
  });

  const loading = sensorLoading || energyLoading;
  const sData = (sensorStats as any)?.data ?? sensorStats;
  const eData = Array.isArray(energyStats) ? energyStats : (energyStats as any)?.data ?? [];

  const totalEnergy = eData.reduce((sum: number, item: any) => sum + (item.energy ?? 0), 0);
  const avgPower = eData.length > 0
    ? eData.reduce((sum: number, item: any) => sum + (item.power ?? 0), 0) / eData.length
    : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Báo cáo tổng hợp</h2>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(['24h', '7d', '30d'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                period === p
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {p === '24h' ? '24 giờ' : p === '7d' ? '7 ngày' : '30 ngày'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Sensor Stats */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-700 text-sm uppercase tracking-wide">Môi trường</h3>
            {sData ? (
              [
                { label: 'Nhiệt độ TB', value: `${sData.temperature?.avg?.toFixed(1) ?? '--'}°C`, sub: `${sData.temperature?.min?.toFixed(1)}°C – ${sData.temperature?.max?.toFixed(1)}°C` },
                { label: 'Độ ẩm TB', value: `${sData.humidity?.avg?.toFixed(1) ?? '--'}%`, sub: `${sData.humidity?.min?.toFixed(1)}% – ${sData.humidity?.max?.toFixed(1)}%` },
                { label: 'Áp suất TB', value: `${sData.pressure?.avg?.toFixed(0) ?? '--'} hPa`, sub: `${sData.pressure?.min?.toFixed(0)} – ${sData.pressure?.max?.toFixed(0)} hPa` },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">{item.label}</span>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{item.value}</p>
                    <p className="text-xs text-gray-400">{item.sub}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm">Không có dữ liệu</p>
            )}
          </div>

          {/* Energy Stats */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-700 text-sm uppercase tracking-wide">Năng lượng</h3>
            {[
              { label: 'Tổng điện tiêu thụ', value: `${totalEnergy.toFixed(3)} Wh` },
              { label: 'Công suất trung bình', value: `${avgPower.toFixed(2)} W` },
              { label: 'Số mẫu đo', value: `${eData.length}` },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">{item.label}</span>
                <p className="font-semibold text-gray-900">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
