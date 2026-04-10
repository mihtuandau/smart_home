'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sensorsApi } from '@/lib/api/sensors';
import { apiClient } from '@/lib/api/client';
import { useLanguage } from '@/contexts/LanguageContext';

type Period = '24h' | '7d' | '30d';

const periodHours: Record<Period, number> = {
  '24h': 24,
  '7d': 168,
  '30d': 720,
};

const PERIOD_LABELS: Record<Period, string> = {
  '24h': '24 giờ qua',
  '7d': '7 ngày qua',
  '30d': '30 ngày qua',
};

interface SensorMetric { avg?: number; min?: number; max?: number; }
interface SensorStatsShape {
  temperature?: SensorMetric;
  humidity?: SensorMetric;
  pressure?: SensorMetric;
}
interface ApiDataResponse<T> { data?: T; }
interface EnergyKwhResult { kwh: number; avgPowerW: number; sampleCount: number; }

export default function ReportGenerator() {
  const [period, setPeriod] = useState<Period>('24h');
  const { t } = useLanguage();
  const hours = periodHours[period];

  // ── 1. Sensor stats ──────────────────────────────────────────────────────
  const { data: sensorStats, isLoading: sensorLoading } = useQuery({
    queryKey: ['report-sensor-stats', hours],
    queryFn: () => sensorsApi.getSensorStats(hours, 'avg'),
    refetchInterval: 30000,
  });

  // ── 2. kWh từ endpoint chính xác (Riemann trên raw PowerData, rolling) ───
  const { data: energyKwh, isLoading: energyLoading } = useQuery({
    queryKey: ['report-energy-kwh', hours],
    queryFn: () => apiClient.request<EnergyKwhResult>(`/ai/energy-kwh?hours=${hours}`),
    refetchInterval: 60000,
  });

  const loading = sensorLoading || energyLoading;

  const sData =
    ((sensorStats as ApiDataResponse<SensorStatsShape> | undefined)?.data as SensorStatsShape | undefined) ??
    (sensorStats as SensorStatsShape | undefined);

  const result = energyKwh as EnergyKwhResult | undefined;
  const totalKwh: number = result?.kwh ?? 0;
  const avgPowerW: number = result?.avgPowerW ?? 0;
  const sampleCount: number = result?.sampleCount ?? 0;

  return (
    <div className="section-card border border-border rounded-xl p-4 sm:p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-base sm:text-lg font-semibold text-foreground">{t('reports.summaryReport')}</h2>
        <div className="flex gap-1 bg-muted rounded-lg p-1 w-full sm:w-auto">
          {(['24h', '7d', '30d'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition ${
                period === p ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-12 bg-muted rounded" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <div className="space-y-3">
            <h3 className="font-medium text-foreground/80 text-xs sm:text-sm uppercase tracking-wide">{t('reports.environment')}</h3>
            {sData ? (
              [
                { label: t('reports.avgTemperature'), value: `${sData.temperature?.avg?.toFixed(1) ?? '--'}°C`, sub: `${sData.temperature?.min?.toFixed(1)}°C – ${sData.temperature?.max?.toFixed(1)}°C` },
                { label: t('reports.avgHumidity'), value: `${sData.humidity?.avg?.toFixed(1) ?? '--'}%`, sub: `${sData.humidity?.min?.toFixed(1)}% – ${sData.humidity?.max?.toFixed(1)}%` },
                { label: t('reports.avgPressure'), value: `${sData.pressure?.avg?.toFixed(0) ?? '--'} hPa`, sub: `${sData.pressure?.min?.toFixed(0)} – ${sData.pressure?.max?.toFixed(0)} hPa` },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-xs sm:text-sm text-foreground/70">{item.label}</span>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{item.value}</p>
                    <p className="text-[11px] sm:text-xs text-muted-foreground">{item.sub}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">{t('reports.noData')}</p>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="font-medium text-foreground/80 text-xs sm:text-sm uppercase tracking-wide">{t('energy.title')}</h3>
            {[
              {
                label: t('reports.totalConsumedEnergy'),
                value: `${totalKwh.toFixed(3)} kWh`,
                sub: `Tích phân Riemann · ${PERIOD_LABELS[period]}`,
              },
              {
                label: t('reports.averagePower'),
                value: `${avgPowerW.toFixed(2)} W`,
                sub: '',
              },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <span className="text-xs sm:text-sm text-foreground/70">{item.label}</span>
                  {item.sub && <p className="text-[10px] text-muted-foreground">{item.sub}</p>}
                </div>
                <p className="font-semibold text-foreground">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
