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

export default function ExportTools() {
  const { t } = useLanguage();
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [preset, setPreset] = useState<Preset>('7d');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // today as max value for date inputs
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

  const exportToCSV = async (type: 'sensors' | 'energy') => {
    const hours = getHours();
    if (hours === null) return;
    if (hours > 8760) { toast.error(t('reports.maxOneYear')); return; }

    setIsExporting(type);
    try {
      let rows: any[] = [];
      let filename = '';
      const periodLabel = getPeriodLabel().replace(/[→ ]/g, '_').replace(/\//g, '-');

      if (type === 'sensors') {
        // Fetch all pages
        let page = 1;
        const pageSize = 500;
        while (true) {
          const res = await apiClient.request<any>(
            `/sensors/history/${hours}?page=${page}&pageSize=${pageSize}`
          );
          const pageData = (res.data ?? res) as any[];
          rows = rows.concat(pageData);
          if (pageData.length < pageSize) break;
          page++;
          if (rows.length >= 5000) break; // safety cap
        }
        filename = `sensors_${periodLabel}_${today}.csv`;
      } else {
        const res = await apiClient.request<any>(`/energy/stats?hours=${hours}`);
        rows = (res.data ?? res) as any[];
        filename = `energy_${periodLabel}_${today}.csv`;
      }

      if (!rows.length) { toast.error(t('reports.noDataRange')); return; }

      const headers = Object.keys(rows[0]).join(',');
      const body = rows
        .map((r) =>
          Object.values(r)
            .map((v) => (String(v).includes(',') ? `"${v}"` : v))
            .join(',')
        )
        .join('\n');
      const blob = new Blob([`\uFEFF${headers}\n${body}`], { type: 'text/csv;charset=utf-8;' });
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

      {/* Period selector */}
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

        {/* Custom date range */}
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

      {/* Export buttons */}
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


