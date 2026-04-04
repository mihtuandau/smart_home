'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sensorsApi } from '@/lib/api/sensors';
import { energyApi } from '@/lib/api/energy';
import { useLanguage } from '@/contexts/LanguageContext';

type Period = '24h' | '7d' | '30d';

const periodHours: Record<Period, number> = {
  '24h': 24,
  '7d': 168,
  '30d': 720,
};

interface SensorMetric {
  avg?: number;
  min?: number;
  max?: number;
}

interface SensorStatsShape {
  temperature?: SensorMetric;
  humidity?: SensorMetric;
  pressure?: SensorMetric;
}

interface EnergyPoint {
  energy?: number;
  power?: number;
}

interface ApiDataResponse<T> {
  data?: T;
}

export default function ReportGenerator() {
  const [period, setPeriod] = useState<Period>('24h');
  const { t } = useLanguage();
  const hours = periodHours[period];

  const { data: sensorStats, isLoading: sensorLoading } = useQuery({
    queryKey: ['report-sensor-stats', hours],
    queryFn: () => sensorsApi.getSensorStats(hours, 'avg'),
  });

  const { data: energyStats, isLoading: energyLoading } = useQuery({
    queryKey: ['report-energy-stats', hours],
    queryFn: () => energyApi.getEnergyStats(hours, 'avg'),
  });

  const loading = sensorLoading || energyLoading;
  const sData =
    ((sensorStats as ApiDataResponse<SensorStatsShape> | undefined)?.data as SensorStatsShape | undefined) ??
    (sensorStats as SensorStatsShape | undefined);
  const eData: EnergyPoint[] = Array.isArray(energyStats)
    ? (energyStats as EnergyPoint[])
    : ((energyStats as ApiDataResponse<EnergyPoint[]> | undefined)?.data ?? []);

  const totalEnergy = eData.reduce((sum: number, item) => sum + (item.energy ?? 0), 0);
  const avgPower = eData.length > 0
    ? eData.reduce((sum: number, item) => sum + (item.power ?? 0), 0) / eData.length
    : 0;

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
                period === p
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {p === '24h' ? t('reports.last24Hours') : p === '7d' ? t('reports.last7Days') : t('reports.last30Days')}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded" />
          ))}
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
              { label: t('reports.totalConsumedEnergy'), value: `${totalEnergy.toFixed(3)} Wh` },
              { label: t('reports.averagePower'), value: `${avgPower.toFixed(2)} W` },
              { label: t('reports.sampleCount'), value: `${eData.length}` },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-xs sm:text-sm text-foreground/70">{item.label}</span>
                <p className="font-semibold text-foreground">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
