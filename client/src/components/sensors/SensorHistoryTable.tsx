'use client';

import { useState } from 'react';
import { useSensorHistory } from '@/hooks/useSensors';

export default function SensorHistoryTable() {
  const [hours, setHours] = useState(24);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;
  const { data: response, isLoading, error } = useSensorHistory(hours, page, PAGE_SIZE);

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
    <div className="bg-white rounded-lg p-4 md:p-6 border border-gray-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Lịch sử cảm biến</h2>
        <div className="flex gap-2">
          <select
            value={hours}
            onChange={(e) => handleHoursChange(Number(e.target.value))}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={6}>6 giờ qua</option>
            <option value={12}>12 giờ qua</option>
            <option value={24}>24 giờ qua</option>
            <option value={48}>48 giờ qua</option>
            <option value={168}>7 ngày qua</option>
            <option value={720}>30 ngày qua</option>
          </select>
          <button className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Xuất CSV
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded mb-2"></div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded mb-1"></div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-600">
          Không thể tải dữ liệu lịch sử
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Thời gian</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Nhiệt độ (°C)</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Độ ẩm (%)</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Áp suất (hPa)</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={row.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                  <td className="px-4 py-3 text-gray-900 font-medium">{row.timestamp}</td>
                  <td className="px-4 py-3 text-right text-red-600 font-medium">{row.temperature !== undefined ? row.temperature.toFixed(1) : '--'}</td>
                  <td className="px-4 py-3 text-right text-blue-600 font-medium">{row.humidity !== undefined ? row.humidity.toFixed(1) : '--'}</td>
                  <td className="px-4 py-3 text-right text-purple-600 font-medium">{row.pressure ?? '--'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && !error && data.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Không có dữ liệu trong khoảng thời gian này
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-gray-500">
        <span>Hiển thị {data.length} / {total} bản ghi</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Trước
          </button>
          <span className="px-2">{page} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Sau
          </button>
        </div>
      </div>
    </div>
  );
}
