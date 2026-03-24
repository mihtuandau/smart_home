'use client';

import React, { useState } from 'react';
import { apiClient } from '@/lib/api/client';
import toast from 'react-hot-toast';
import { Activity, Download, Loader2, Zap } from 'lucide-react';

type Preset = '24h' | '7d' | '30d' | 'custom';

const presetHours: Record<Exclude<Preset, 'custom'>, number> = {
  '24h': 24,
  '7d': 168,
  '30d': 720,
};

const presetLabels: Record<Exclude<Preset, 'custom'>, string> = {
  '24h': '24 giờ',
  '7d': '7 ngày',
  '30d': '30 ngày',
};

export default function ExportTools() {
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [preset, setPreset] = useState<Preset>('7d');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // today as max value for date inputs
  const today = new Date().toISOString().slice(0, 10);

  const getHours = (): number | null => {
    if (preset !== 'custom') return presetHours[preset];
    if (!fromDate) { toast.error('Vui lòng chọn ngày bắt đầu'); return null; }
    const from = new Date(fromDate);
    const to = toDate ? new Date(toDate + 'T23:59:59') : new Date();
    if (from > to) { toast.error('Ngày bắt đầu phải trước ngày kết thúc'); return null; }
    const diffMs = to.getTime() - from.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60));
  };

  const getPeriodLabel = (): string => {
    if (preset !== 'custom') return presetLabels[preset];
    if (fromDate && toDate) return `${fromDate} → ${toDate}`;
    if (fromDate) return `từ ${fromDate}`;
    return 'tùy chỉnh';
  };

  const exportToCSV = async (type: 'sensors' | 'energy') => {
    const hours = getHours();
    if (hours === null) return;
    if (hours > 8760) { toast.error('Khoảng thời gian tối đa là 1 năm'); return; }

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

      if (!rows.length) { toast.error('Không có dữ liệu trong khoảng thời gian đã chọn'); return; }

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
      toast.success(`Đã xuất ${rows.length} dòng → ${filename}`);
    } catch {
      toast.error('Xuất dữ liệu thất bại');
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="section-card border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm space-y-5">
      <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
        <Download className="w-5 h-5 text-gray-600" />
        Xuất dữ liệu CSV
      </h2>

      {/* Period selector */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700">Khoảng thời gian</p>
        <div className="flex flex-wrap gap-2">
          {(['24h', '7d', '30d', 'custom'] as Preset[]).map((p) => (
            <button
              key={p}
              onClick={() => setPreset(p)}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium border transition ${
                preset === p
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
              }`}
            >
              {p === 'custom' ? 'Tùy chỉnh' : presetLabels[p]}
            </button>
          ))}
        </div>

        {/* Custom date range */}
        {preset === 'custom' && (
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-start sm:items-end pt-1">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Từ ngày</label>
              <input
                type="date"
                max={today}
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Đến ngày</label>
              <input
                type="date"
                min={fromDate}
                max={today}
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                placeholder={today}
              />
            </div>
            <p className="text-xs text-gray-400 sm:self-end pb-2">
              Để trống "Đến ngày" = đến hiện tại
            </p>
          </div>
        )}
      </div>

      {/* Export buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          {
            type: 'sensors' as const,
            label: 'Xuất dữ liệu cảm biến',
            sublabel: 'Nhiệt độ, độ ẩm, áp suất, ánh sáng, mưa',
            icon: <Activity className="w-5 h-5" />,
          },
          {
            type: 'energy' as const,
            label: 'Xuất dữ liệu năng lượng',
            sublabel: 'Điện áp, dòng điện, công suất, năng lượng',
            icon: <Zap className="w-5 h-5" />,
          },
        ].map(({ type, label, sublabel, icon }) => (
          <button
            key={type}
            onClick={() => exportToCSV(type)}
            disabled={isExporting !== null}
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed text-left"
          >
            <div className="text-blue-600 shrink-0">{icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm sm:text-base font-medium text-gray-900">{label}</p>
              <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">{sublabel}</p>
            </div>
            {isExporting === type ? (
              <Loader2 className="animate-spin h-4 w-4 text-blue-600 shrink-0" />
            ) : (
              <Download className="w-4 h-4 text-gray-400 shrink-0" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}


