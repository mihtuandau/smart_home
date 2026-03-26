'use client';

import { useState } from 'react';
import { useSensorHistory } from '@/hooks/useSensors';

export default function SensorHistoryTable() {
  const [hours, setHours] = useState(24);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;
  const { data: response, isLoading, error } = useSensorHistory(hours, page, PAGE_SIZE);

  const formatNumber = (value: unknown, digits = 1) => {
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed.toFixed(digits) : '--';
  };

  const historyData = ((response as any)?.data || []) as any[];
  const totalPages: number = (response as any)?.totalPages || 1;
  const total: number = (response as any)?.total || 0;
  const data = historyData.map((item, index) => ({
    id: index,
    timestamp: new Date(item.timestamp).toLocaleString('vi-VN'),
    temperature: item.temperature,
    humidity: item.humidity,
    pressure: item.pressure,
  }));

  const handleHoursChange = (newHours: number) => {
    setHours(newHours);
    setPage(1); // reset về trang 1 khi đổi khoảng thời gian
  };

  return (
    <div className="section-card shadow-sm border border-border p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-foreground">Lịch sử cảm biến</h2>
        <div className="flex flex-wrap gap-2 text-foreground/80 items-center">
          <select
            value={hours}
            onChange={(e) => handleHoursChange(Number(e.target.value))}
            className="px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-card text-foreground"
          >
            <option value={6}>6 giờ qua</option>
            <option value={12}>12 giờ qua</option>
            <option value={24}>24 giờ qua</option>
            <option value={48}>48 giờ qua</option>
            <option value={168}>7 ngày qua</option>
            <option value={720}>30 ngày qua</option>
          </select>
          <button className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Xuất CSV
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
          Không thể tải dữ liệu lịch sử
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-xs sm:text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-4 py-3 text-left font-semibold text-foreground/80 whitespace-nowrap">Thời gian</th>
                <th className="px-4 py-3 text-right font-semibold text-foreground/80 whitespace-nowrap">Nhiệt độ (°C)</th>
                <th className="px-4 py-3 text-right font-semibold text-foreground/80 whitespace-nowrap">Độ ẩm (%)</th>
                <th className="px-4 py-3 text-right font-semibold text-foreground/80 whitespace-nowrap">Áp suất (hPa)</th>
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
          Không có dữ liệu trong khoảng thời gian này
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>Hiển thị {data.length} / {total} bản ghi</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 border border-border rounded hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Trước
          </button>
          <span className="px-2">{page} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1 border border-border rounded hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Sau
          </button>
        </div>
      </div>
    </div>
  );
}
