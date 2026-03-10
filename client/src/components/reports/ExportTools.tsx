'use client';

import React, { useState } from 'react';
import { apiClient } from '@/lib/api/client';
import toast from 'react-hot-toast';

export default function ExportTools() {
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const exportToCSV = async (type: 'sensors' | 'energy') => {
    setIsExporting(type);
    try {
      let rows: any[] = [];
      let filename = '';

      if (type === 'sensors') {
        const res = await apiClient.request<any>('/sensors/history/168?page=1&pageSize=500');
        rows = (res.data ?? res) as any[];
        filename = `sensors_${new Date().toISOString().slice(0, 10)}.csv`;
      } else {
        const res = await apiClient.request<any>('/energy/stats?hours=168');
        rows = (res.data ?? res) as any[];
        filename = `energy_${new Date().toISOString().slice(0, 10)}.csv`;
      }

      if (!rows.length) { toast.error('Không có dữ liệu để xuất'); return; }

      const headers = Object.keys(rows[0]).join(',');
      const body = rows.map((r) => Object.values(r).map((v) => `"${v}"`).join(',')).join('\n');
      const blob = new Blob([`${headers}\n${body}`], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      toast.success(`Đã xuất ${filename}`);
    } catch {
      toast.error('Xuất dữ liệu thất bại');
    } finally {
      setIsExporting(null);
    }
  };

  const exportButtons = [
    {
      type: 'sensors' as const,
      label: 'Xuất dữ liệu cảm biến',
      sublabel: 'CSV — 7 ngày gần nhất',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      type: 'energy' as const,
      label: 'Xuất dữ liệu năng lượng',
      sublabel: 'CSV — 7 ngày gần nhất',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Xuất dữ liệu
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {exportButtons.map(({ type, label, sublabel, icon }) => (
          <button
            key={type}
            onClick={() => exportToCSV(type)}
            disabled={isExporting !== null}
            className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed text-left"
          >
            <div className="text-blue-600">{icon}</div>
            <div>
              <p className="font-medium text-gray-900">{label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{sublabel}</p>
            </div>
            {isExporting === type && (
              <svg className="animate-spin h-4 w-4 text-blue-600 ml-auto" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
