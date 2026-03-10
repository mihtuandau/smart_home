'use client';

import React from 'react';
import AIInsights from '@/components/ai/AIInsights';
import { useAiContext } from '@/contexts/AiContext';
import { useBillingForecast, useLedDailyStats } from '@/hooks/useBilling';

export default function AiPage() {
  const { alerts, clearAlerts, ledHistory, ledHistoryLoading } = useAiContext();
  const { data: forecast, isLoading: forecastLoading } = useBillingForecast();
  const { data: ledDaily } = useLedDailyStats(7);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Trợ lý AI</h1>
        <p className="text-sm text-gray-500 mt-1">
          Phân tích thông minh, dự báo tiêu thụ điện và lời khuyên tiết kiệm năng lượng
        </p>
      </div>

      {/* Main AI Insights */}
      <AIInsights />

      {/* Billing Forecast */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Dự báo hóa đơn điện tháng này
        </h2>
        {forecastLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        ) : forecast ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-sm text-blue-600 font-medium">Đã dùng</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">
                {((forecast as any).consumed_kwh ?? 0).toFixed(2)} kWh
              </p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <p className="text-sm text-orange-600 font-medium">Dự báo cuối tháng</p>
              <p className="text-2xl font-bold text-orange-900 mt-1">
                {((forecast as any).projected_kwh ?? 0).toFixed(2)} kWh
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-sm text-green-600 font-medium">Chi phí ước tính</p>
              <p className="text-2xl font-bold text-green-900 mt-1">
                {((forecast as any).projected_cost_vnd ?? 0).toLocaleString('vi-VN')} ₫
              </p>
            </div>
            {(forecast as any).report && (
              <div className="col-span-full bg-gray-50 rounded-lg p-4 text-sm text-gray-600 whitespace-pre-line">
                {(forecast as any).report}
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">Chưa có dữ liệu dự báo</p>
        )}
      </div>

      {/* Alert History */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Lịch sử cảnh báo hôm nay
            {alerts.length > 0 && (
              <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {alerts.length}
              </span>
            )}
          </h2>
          {alerts.length > 0 && (
            <button
              onClick={clearAlerts}
              className="text-xs text-gray-500 hover:text-red-600 transition"
            >
              Xóa tất cả
            </button>
          )}
        </div>
        {alerts.length === 0 ? (
          <p className="text-gray-400 text-sm">Không có cảnh báo nào hôm nay</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {alerts.slice().reverse().map((alert, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100 text-sm"
              >
                <span className="text-gray-400 text-xs mt-0.5 shrink-0">
                  {new Date(alert.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-gray-700">{alert.analysis}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
