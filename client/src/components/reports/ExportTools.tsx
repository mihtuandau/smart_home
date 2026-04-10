'use client';

import React, { useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { useLanguage } from '@/contexts/LanguageContext';
import toast from 'react-hot-toast';
import { Activity, Download, Loader2, Zap } from 'lucide-react';

type Preset = '24h' | '7d' | '30d' | 'custom';

const presetHours: Record<Exclude<Preset, 'custom'>, number> = {
  '24h': 24,
  '7d': 168,
  '30d': 720,
};

type CsvRow = Record<string, unknown>;

interface ApiDataResponse<T> {
  data?: T;
}

export default function ExportTools() {
  const { t, language } = useLanguage();
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [preset, setPreset] = useState<Preset>('7d');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const today = new Date().toISOString().slice(0, 10);

  const getHours = (): number | null => {
    if (preset !== 'custom') return presetHours[preset];
    if (!fromDate) { toast.error(t('reports.selectStartDate')); return null; }
    const from = new Date(fromDate);
    const to = toDate ? new Date(toDate + 'T23:59:59') : new Date();
    if (from > to) { toast.error(t('reports.startBeforeEnd')); return null; }
    const diffMs = to.getTime() - from.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60));
  };

  const getPeriodLabel = (): string => {
    if (preset !== 'custom') return preset === '24h' ? t('reports.last24Hours') : preset === '7d' ? t('reports.last7Days') : t('reports.last30Days');
    if (fromDate && toDate) return `${fromDate} → ${toDate}`;
    if (fromDate) return `${t('reports.fromDatePrefix')} ${fromDate}`;
    return t('reports.custom');
  };

  const getLocale = () => {
    if (language === 'en') return 'en-US';
    if (language === 'zh') return 'zh-CN';
    return 'vi-VN';
  };

  const yesNoLabel = (value: boolean) => {
    if (language === 'en') return value ? 'Yes' : 'No';
    if (language === 'zh') return value ? '是' : '否';
    return value ? 'Có' : 'Không';
  };

  const getLocalLabel = (
    vi: string,
    en: string,
    zh: string,
  ) => {
    if (language === 'en') return en;
    if (language === 'zh') return zh;
    return vi;
  };

  const toDateTime = (value: unknown): string => {
    if (typeof value !== 'string' && typeof value !== 'number' && !(value instanceof Date)) {
      return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString(getLocale());
  };

  const toNumber = (value: unknown): number | null => {
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const formatDecimal = (value: unknown, digits: number): string => {
    const parsed = toNumber(value);
    return parsed === null ? '' : parsed.toFixed(digits);
  };

  const escapeCsvValue = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    const text = String(value);
    const escaped = text.replace(/"/g, '""');
    if (/[",\n\r]/.test(escaped)) {
      return `"${escaped}"`;
    }
    return escaped;
  };

  const toFriendlySensorRow = (raw: CsvRow) => {
    const timestamp = raw.timestamp ?? raw.bucketStart ?? raw.createdAt;
    const temperature = raw.temperature ?? raw.temperatureAvg ?? raw.temp;
    const humidity = raw.humidity ?? raw.humidityAvg ?? raw.humi;
    const pressure = raw.pressure ?? raw.pressureAvg ?? raw.pres;
    const lightLevel = raw.lightLevel ?? raw.lightLevelAvg;
    const samples = raw.samples;
    const isDark = raw.isDark;
    const isRaining = raw.isRaining ?? raw.rain;

    return {
      [t('sensors.time')]: toDateTime(timestamp),
      [`${t('sensors.temperature')} (°C)`]: formatDecimal(temperature, 1),
      [`${t('sensors.humidity')} (%)`]: formatDecimal(humidity, 1),
      [`${t('sensors.pressure')} (hPa)`]: formatDecimal(pressure, 1),
      [getLocalLabel('Cường độ ánh sáng', 'Light Intensity', '光照强度')]: formatDecimal(lightLevel, 0),
      [getLocalLabel('Trời tối', 'Is Dark', '是否为暗环境')]:
        typeof isDark === 'boolean' ? yesNoLabel(isDark) : '',
      [getLocalLabel('Có mưa', 'Raining', '是否下雨')]:
        typeof isRaining === 'boolean' ? yesNoLabel(isRaining) : '',
      [getLocalLabel('Số mẫu tổng hợp', 'Sample Count', '聚合样本数')]: formatDecimal(samples, 0),
    };
  };

  const toFriendlyEnergyRow = (raw: CsvRow) => {
    const timestamp = raw.timestamp ?? raw.bucketStart ?? raw.createdAt;
    const voltage = raw.voltage ?? raw.voltageAvg;
    const current = raw.current ?? raw.currentAvg;
    const power = raw.power ?? raw.powerAvg;
    const source = raw.source;
    const battery = raw.batteryLevel ?? raw.batteryLevelAvg;
    const bucketMinutes = (raw.bucketMinutes as number) ?? 5;

    // Tính điện năng bằng Tích phân Riemann: P(W) × t(h) = Wh
    // Không dùng raw.energy vì đó là giá trị nội bộ của chip INA219, không chính xác.
    const powerW = toNumber(power) ?? 0;
    const computedWh = powerW * (bucketMinutes / 60);

    return {
      [t('sensors.time')]: toDateTime(timestamp),
      [`${t('energy.voltage')} (V)`]: formatDecimal(voltage, 2),
      [`${t('energy.current')} (A)`]: formatDecimal(current, 3),
      [`${t('energy.power')} (W)`]: formatDecimal(power, 2),
      [getLocalLabel('Tiêu thụ (Wh)', 'Consumption (Wh)', '消耗 (Wh)')]: computedWh.toFixed(4),
      [getLocalLabel('Nguồn điện', 'Power Source', '电源来源')]: source ? String(source) : '',
      [getLocalLabel('Mức pin (%)', 'Battery Level (%)', '电池电量 (%)')]: formatDecimal(battery, 1),
    };
  };

  const exportToCSV = async (type: 'sensors' | 'energy') => {
    const hours = getHours();
    if (hours === null) return;
    if (hours > 8760) { toast.error(t('reports.maxOneYear')); return; }

    setIsExporting(type);
    try {
      let rows: CsvRow[] = [];
      let filename = '';
      const periodLabel = getPeriodLabel().replace(/[→ ]/g, '_').replace(/\//g, '-');

      if (type === 'sensors') {
        let page = 1;
        const pageSize = 500;
        while (true) {
          const res = await apiClient.request<ApiDataResponse<CsvRow[]> | CsvRow[]>(
            `/sensors/history/${hours}?page=${page}&pageSize=${pageSize}&mode=avg`
          );
          const pageData = Array.isArray(res)
            ? res
            : Array.isArray(res.data)
              ? res.data
              : [];
          rows = rows.concat(pageData);
          if (pageData.length < pageSize) break;
          page++;
          if (rows.length >= 5000) break;
        }
        filename = `sensors_${periodLabel}_${today}.csv`;
      } else {
        const res = await apiClient.request<ApiDataResponse<CsvRow[]> | CsvRow[]>(`/energy/stats?hours=${hours}&mode=avg`);
        rows = Array.isArray(res)
          ? res
          : Array.isArray(res.data)
            ? res.data
            : [];
        filename = `energy_${periodLabel}_${today}.csv`;
      }

      if (!rows.length) { toast.error(t('reports.noDataRange')); return; }

      const normalizedRows = (type === 'sensors'
        ? rows.map((row) => toFriendlySensorRow(row))
        : rows.map((row) => toFriendlyEnergyRow(row))) as Array<Record<string, string>>;

      const headers = Object.keys(normalizedRows[0]);
      const csvLines = [
        headers.map((h) => escapeCsvValue(h)).join(','),
        ...normalizedRows.map((row) =>
          headers.map((header) => escapeCsvValue(row[header] ?? '')).join(','),
        ),
      ];

      const blob = new Blob([`\uFEFF${csvLines.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      toast.success(t('reports.exportSuccess').replace('{rows}', String(rows.length)).replace('{filename}', filename));
    } catch {
      toast.error(t('reports.exportFailed'));
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="section-card border border-border rounded-xl p-4 sm:p-6 shadow-sm space-y-5">
      <h2 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
        <Download className="w-5 h-5 text-foreground/70" />
        {t('reports.exportCsvTitle')}
      </h2>

      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground/80">{t('reports.dateRange')}</p>
        <div className="flex flex-wrap gap-2">
          {(['24h', '7d', '30d', 'custom'] as Preset[]).map((p) => (
            <button
              key={p}
              onClick={() => setPreset(p)}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium border transition ${
                preset === p
                  ? 'bg-card text-primary border-primary shadow-sm'
                  : 'bg-background text-foreground/70 border-border hover:border-primary/40'
              }`}
            >
              {p === 'custom'
                ? t('reports.custom')
                : p === '24h'
                  ? t('reports.last24Hours')
                  : p === '7d'
                    ? t('reports.last7Days')
                    : t('reports.last30Days')}
            </button>
          ))}
        </div>

        {preset === 'custom' && (
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-start sm:items-end pt-1">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">{t('reports.from')}</label>
              <input
                type="date"
                max={today}
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground bg-card"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">{t('reports.to')}</label>
              <input
                type="date"
                min={fromDate}
                max={today}
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground bg-card"
                placeholder={today}
              />
            </div>
            <p className="text-xs text-muted-foreground sm:self-end pb-2">
              {t('reports.emptyToDateHint')}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          {
            type: 'sensors' as const,
            label: t('reports.exportSensorData'),
            sublabel: t('reports.sensorSublabel'),
            icon: <Activity className="w-5 h-5" />,
          },
          {
            type: 'energy' as const,
            label: t('reports.exportEnergyData'),
            sublabel: t('reports.energySublabel'),
            icon: <Zap className="w-5 h-5" />,
          },
        ].map(({ type, label, sublabel, icon }) => (
          <button
            key={type}
            onClick={() => exportToCSV(type)}
            disabled={isExporting !== null}
            className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary/40 dark:hover:bg-primary/10 hover:bg-primary/5 transition disabled:opacity-50 disabled:cursor-not-allowed text-left"
          >
            <div className="text-primary shrink-0">{icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm sm:text-base font-medium text-foreground">{label}</p>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">{sublabel}</p>
            </div>
            {isExporting === type ? (
              <Loader2 className="animate-spin h-4 w-4 text-primary shrink-0" />
            ) : (
              <Download className="w-4 h-4 text-muted-foreground/70 shrink-0" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
