'use client';

import { useState } from 'react';
import { useSensorHistory } from '@/hooks/sensors';
import { useLanguage } from '@/contexts/LanguageContext';
import toast from 'react-hot-toast';

const dateLocaleMap = {
  vi: 'vi-VN',
  en: 'en-US',
  zh: 'zh-CN',
} as const;

interface SensorHistoryItem {
  timestamp: string;
  temperature?: number;
  humidity?: number;
  pressure?: number;
}

interface SensorHistoryResponse {
  data?: SensorHistoryItem[];
  totalPages?: number;
  total?: number;
}

export default function SensorHistoryTable() {
  const [hours, setHours] = useState(24);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;
  const { t, language } = useLanguage();
  const { data: response, isLoading, error } = useSensorHistory(hours, page, PAGE_SIZE);

  const formatNumber = (value: unknown, digits = 1) => {
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed.toFixed(digits) : '--';
  };

  const pickFirstFiniteNumber = (...values: unknown[]) => {
    for (const value of values) {
      const parsed = typeof value === 'number' ? value : Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
    return undefined;
  };

  const normalizeHistoryItem = (item: SensorHistoryItem) => {
    const raw = item as unknown as Record<string, unknown>;
    const timestampRaw =
      item.timestamp ??
      (typeof raw.time === 'string' ? raw.time : undefined) ??
      (typeof raw.createdAt === 'string' ? raw.createdAt : undefined);

    if (!timestampRaw) {
      return null;
    }

    const temperature = pickFirstFiniteNumber(item.temperature, raw.temp, raw.temp_c);
    const humidity = pickFirstFiniteNumber(item.humidity, raw.humi, raw.humidity_percent);
    const pressure = pickFirstFiniteNumber(item.pressure, raw.pres, raw.pressure_hpa);

    if (temperature === undefined && humidity === undefined && pressure === undefined) {
      return null;
    }

    return {
      timestampRaw,
      temperature,
      humidity,
      pressure,
    };
  };

  const historyResponse = (response as SensorHistoryResponse | undefined);
  const historyData = (historyResponse?.data || []) as SensorHistoryItem[];
  const totalPages: number = historyResponse?.totalPages || 1;
  const total: number = historyResponse?.total || 0;
  const data = historyData
    .map(normalizeHistoryItem)
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .map((item, index) => ({
      id: `${item.timestampRaw}-${index}`,
      timestamp: new Date(item.timestampRaw).toLocaleString(dateLocaleMap[language]),
      temperature: item.temperature,
      humidity: item.humidity,
      pressure: item.pressure,
    }));

  const handleHoursChange = (newHours: number) => {
    setHours(newHours);
    setPage(1);
  };

  const exportCurrentTable = () => {
    if (!data.length) {
      toast.error(t('reports.noDataRange'));
      return;
    }

    try {
      const headers = [
        t('sensors.time'),
        `${t('sensors.temperature')} (°C)`,
        `${t('sensors.humidity')} (%)`,
        `${t('sensors.pressure')} (hPa)`,
      ];

      const escapeCsv = (value: string) => {
        const escaped = value.replace(/"/g, '""');
        if (/[",\n\r]/.test(escaped)) {
          return `"${escaped}"`;
        }
        return escaped;
      };

      const body = data
        .map((row) => [
          escapeCsv(row.timestamp),
          formatNumber(row.temperature, 1),
          formatNumber(row.humidity, 1),
          formatNumber(row.pressure, 1),
        ].join(','))
        .join('\n');

      const filename = `sensor-history-${hours}h-page-${page}.csv`;
      const csv = `\uFEFF${headers.map(escapeCsv).join(',')}\n${body}`;
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);

      toast.success(
        t('reports.exportSuccess')
          .replace('{rows}', String(data.length))
          .replace('{filename}', filename),
      );
    } catch {
      toast.error(t('reports.exportFailed'));
    }
  };

  return (
    <div className="section-card shadow-sm border border-border p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-foreground">{t('sensors.historyTable')}</h2>
        <div className="flex flex-wrap gap-2 text-foreground/80 items-center">
          <select
            value={hours}
            onChange={(e) => handleHoursChange(Number(e.target.value))}
            className="text-xs sm:text-sm border border-border bg-background rounded-md px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer max-w-fit shadow-sm"
          >
            <option value={6}>{t('sensors.lastHours').replace('{hours}', '6')}</option>
            <option value={12}>{t('sensors.lastHours').replace('{hours}', '12')}</option>
            <option value={24}>{t('sensors.lastHours').replace('{hours}', '24')}</option>
            <option value={48}>{t('sensors.lastDays').replace('{days}', '2')}</option>
            <option value={72}>{t('sensors.lastDays').replace('{days}', '3')}</option>
            <option value={168}>{t('sensors.lastDays').replace('{days}', '7')}</option>
            <option value={720}>{t('sensors.lastDays').replace('{days}', '30')}</option>
          </select>
          <button
            onClick={exportCurrentTable}
            disabled={isLoading || data.length === 0}
            className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('sensors.exportCsv')}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="animate-pulse">
          <div className="h-10 bg-muted rounded mb-2"></div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-muted/60 rounded mb-1"></div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-600">
          {t('sensors.loadHistoryError')}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-xs sm:text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-4 py-3 text-left font-semibold text-foreground/80 whitespace-nowrap">{t('sensors.time')}</th>
                <th className="px-4 py-3 text-right font-semibold text-foreground/80 whitespace-nowrap">{t('sensors.temperature')} (°C)</th>
                <th className="px-4 py-3 text-right font-semibold text-foreground/80 whitespace-nowrap">{t('sensors.humidity')} (%)</th>
                <th className="px-4 py-3 text-right font-semibold text-foreground/80 whitespace-nowrap">{t('sensors.pressure')} (hPa)</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={row.id} className={`border-b border-border/50 hover:bg-muted/50 transition-colors ${index % 2 === 0 ? 'bg-card' : 'bg-muted/30'}`}>
                  <td className="px-4 py-3 text-foreground font-medium whitespace-nowrap">{row.timestamp}</td>
                  <td className="px-4 py-3 text-right text-red-600 font-medium whitespace-nowrap">{formatNumber(row.temperature, 1)}</td>
                  <td className="px-4 py-3 text-right text-blue-600 font-medium whitespace-nowrap">{formatNumber(row.humidity, 1)}</td>
                  <td className="px-4 py-3 text-right text-purple-600 font-medium whitespace-nowrap">{formatNumber(row.pressure, 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && !error && data.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          {t('sensors.noDataInRange')}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>{t('sensors.showingRecords').replace('{shown}', String(data.length)).replace('{total}', String(total))}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 border border-border rounded hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t('sensors.previous')}
          </button>
          <span className="px-2">{page} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1 border border-border rounded hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t('sensors.next')}
          </button>
        </div>
      </div>
    </div>
  );
}
