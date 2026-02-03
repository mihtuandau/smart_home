'use client';

import { useState } from 'react';
import { useSensorHistory } from '@/hooks/useSensors';

export default function SensorHistoryTable() {
  const [hours, setHours] = useState(24);
  const { data: response, isLoading, error } = useSensorHistory(hours);

  // Mock data for now - replace with actual API
  const mockData = [
    { id: 1, timestamp: '2026-02-03 14:30:00', temperature: 25.5, humidity: 62, light: 450, pressure: 1013 },
    { id: 2, timestamp: '2026-02-03 14:25:00', temperature: 25.3, humidity: 63, light: 420, pressure: 1013 },
    { id: 3, timestamp: '2026-02-03 14:20:00', temperature: 25.2, humidity: 64, light: 400, pressure: 1012 },
    { id: 4, timestamp: '2026-02-03 14:15:00', temperature: 25.0, humidity: 65, light: 380, pressure: 1012 },
    { id: 5, timestamp: '2026-02-03 14:10:00', temperature: 24.8, humidity: 66, light: 350, pressure: 1012 },
  ];

  const data = mockData;

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Lịch sử cảm biến
        </h2>
        <div className="flex gap-2">
          <select
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={6}>6 giờ qua</option>
            <option value={12}>12 giờ qua</option>
            <option value={24}>24 giờ qua</option>
            <option value={48}>48 giờ qua</option>
            <option value={168}>7 ngày qua</option>
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
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Ánh sáng (lux)</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Áp suất (hPa)</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={row.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                  <td className="px-4 py-3 text-gray-900 font-medium">{row.timestamp}</td>
                  <td className="px-4 py-3 text-right text-red-600 font-medium">{row.temperature.toFixed(1)}</td>
                  <td className="px-4 py-3 text-right text-blue-600 font-medium">{row.humidity.toFixed(1)}</td>
                  <td className="px-4 py-3 text-right text-yellow-600 font-medium">{row.light}</td>
                  <td className="px-4 py-3 text-right text-purple-600 font-medium">{row.pressure}</td>
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

      <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
        <span>Hiển thị {data.length} bản ghi</span>
        <div className="flex gap-2">
          <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">Trước</button>
          <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">Sau</button>
        </div>
      </div>
    </div>
  );
}
