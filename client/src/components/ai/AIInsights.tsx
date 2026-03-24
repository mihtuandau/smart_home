'use client';

import React from 'react';
import { useAiContext } from '@/contexts/AiContext';
import { useSocket } from '@/hooks/useSocket';
import type { AiAdvicePayload } from '@/hooks/useSocket';
import { Activity, Bell, Bot, Lightbulb } from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────────────────

/**
 * Radar mức tiêu thụ:
 *   < 0.8 W  → 'idle'    : Không tiêu thụ gì
 *   0.8–2 W  → 'normal'  : Bình thường
 *   2–3.5 W  → 'medium'  : Hơi cao
 *   > 3.5 W  → 'high'    : Cao — cảnh báo
 */
function powerLevel(mw: number): 'idle' | 'normal' | 'medium' | 'high' {
  if (mw < 300)  return 'idle';    // không tiêu thụ
  if (mw < 1500) return 'normal';  // chỉ tải nền ~600 mW
  if (mw < 2800) return 'normal';  // 1 đèn bật ~2000 mW → bình thường
  if (mw < 4000) return 'medium';  // 2 đèn bật hoặc hơi cao
  return 'high';
}

/**
 * Parse mậy mW từ chuỗi text khi server chưa restart (chưa có trường powerW).
 * Hiểu cả 2 định dạng: "2.2 W" và "2034 mW"
 */
function parseMwFromText(text: string): number | null {
  const mwMatch = text.match(/(\d+(?:\.\d+)?)\s*mW/i);
  if (mwMatch) return parseFloat(mwMatch[1]);
  const wMatch = text.match(/(\d+(?:\.\d+)?)\s*W(?!h)/i);
  if (wMatch) return parseFloat(wMatch[1]) * 1000;
  return null;
}

// Mỗi hàm trả về class string TĨNH để Tailwind JIT quét được
function barClass(level: ReturnType<typeof powerLevel>) {
  if (level === 'idle')   return 'bg-gray-300';
  if (level === 'normal') return 'bg-green-400';
  if (level === 'medium') return 'bg-yellow-400';
  return 'bg-red-400';
}
function badgeClass(level: ReturnType<typeof powerLevel>) {
  if (level === 'idle')   return 'bg-gray-100 text-gray-600';
  if (level === 'normal') return 'bg-green-50 text-green-700';
  if (level === 'medium') return 'bg-yellow-50 text-yellow-700';
  return 'bg-red-50 text-red-700';
}
function levelLabel(level: ReturnType<typeof powerLevel>) {
  if (level === 'idle')   return 'Không tiêu thụ';
  if (level === 'normal') return 'Bình thường';
  if (level === 'medium') return 'Hơi cao';
  return 'Cao — cảnh báo';
}
function barPct(powerMw: number) {
  // Tỷ lệ thực tế theo thang 0–6000 mW
  return Math.min(Math.round((powerMw / 6000) * 100), 100);
}

function analysisBg(text: string) {
  if (/cảnh báo|bất thường|nguy cơ|cao/i.test(text)) return 'bg-red-50 text-red-700 border-red-100';
  if (/ổn định|an toàn|thành công|tốt/i.test(text)) return 'bg-green-50 text-green-700 border-green-100';
  if (/khuyến nghị|tiết kiệm|theo dõi|tối ưu/i.test(text)) return 'bg-blue-50 text-blue-700 border-blue-100';
  return 'bg-gray-50 text-gray-500 border-gray-100';
}

function alertBorderClass(text: string): string {
  if (/cảnh báo|bất thường|nguy cơ|cao/i.test(text))
    return 'border-red-400 bg-red-50 text-red-800';
  if (/khuyến nghị|tiết kiệm|theo dõi|tối ưu/i.test(text))
    return 'border-green-400 bg-green-50 text-green-800';
  return 'border-blue-400 bg-blue-50 text-blue-800';
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('vi-VN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

// ── Power Gauge ────────────────────────────────────────────────────────────────────────

/** < 1000 mW → hiển thị mW (số nguyên); ≥ 1000 mW → hiển thị W tối đa 2 chữ số thập phân */
function formatPower(mw: number): { value: string; unit: string } {
  if (mw < 1000) return { value: Math.round(mw).toString(), unit: 'mW' };
  const w = mw / 1000;
  // Bỏ số 0 thừa: 2.00 → "2", 2.10 → "2.1", 2.03 → "2.03"
  return { value: parseFloat(w.toFixed(2)).toString(), unit: 'W' };
}

function PowerGauge({ powerMw, led1, led2 }: { powerMw: number; led1: boolean; led2: boolean }) {
  const level = powerLevel(powerMw);
  const { value, unit } = formatPower(powerMw);

  return (
    <div className="px-4 py-3 border-b border-gray-100">
      {/* Top row: value + badge */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-2xl font-bold ${
            level === 'idle'   ? 'text-gray-400' :
            level === 'normal' ? 'text-green-600' :
            level === 'medium' ? 'text-yellow-600' :
            'text-red-600'
          }`}>{value}</span>
          <span className="text-sm text-gray-500 font-medium">{unit}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${badgeClass(level)}`}>
            {levelLabel(level)}
          </span>
        </div>
        {/* LED state indicators */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] sm:text-xs">
          <span className={`px-2 py-0.5 rounded-full font-medium transition-colors ${
            led1 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-400'
          }`}>
            <span className="inline-flex items-center gap-1"><Lightbulb className="w-3 h-3" />Đèn 1</span>
          </span>
          <span className={`px-2 py-0.5 rounded-full font-medium transition-colors ${
            led2 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-400'
          }`}>
            <span className="inline-flex items-center gap-1"><Lightbulb className="w-3 h-3" />Đèn 2</span>
          </span>
        </div>
      </div>
      {/* Progress bar */}
      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
        <div
          className={`h-3 rounded-full transition-all duration-700 ease-out ${barClass(level)}`}
          style={{ width: `${barPct(powerMw)}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
        <span>0</span>
        <span>1000 mW</span>
        <span>3000 mW</span>
        <span>6000+ mW</span>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────────────────

export default function AIInsights() {
  const { isConnected } = useSocket();
  const { status, alerts, clearAlerts: clear } = useAiContext();

  return (
    <div className="section-card border border-gray-200 rounded-xl shadow-sm flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center flex-wrap gap-2">
          <Bot className="w-5 h-5 text-gray-700" />
          <span className="text-sm sm:text-base font-semibold text-gray-800">AI Theo dõi Điện</span>
          {isConnected ? (
            <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Trực tiếp
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-gray-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-gray-300" />
              Offline
            </span>
          )}
        </div>
        {alerts.length > 0 && (
          <button
            onClick={clear}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Xóa tất cả
          </button>
        )}
      </div>

      {/* Power Gauge — dùng powerW từ payload (tính ra mW), fallback parse từ analysis text */}
      {status ? (() => {
        const mw = (status.powerW && status.powerW > 0)
          ? status.powerW * 1000
          : parseMwFromText(status.analysis) ??
            status.advice.reduce<number | null>((acc, a) => acc ?? parseMwFromText(a), null) ?? 0;
        return (
          <PowerGauge
            powerMw={mw}
            led1={status.led1 ?? false}
            led2={status.led2 ?? false}
          />
        );
      })() : (
        <div className="px-4 py-3 border-b border-gray-100 text-sm text-gray-400 inline-flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Đang chờ dữ liệu từ cảm biến...
        </div>
      )}

      {/* Live analysis text */}
      {status && (
        <div className={`px-4 py-2 border-b text-sm font-medium transition-colors ${analysisBg(status.analysis)}`}>
          {status.analysis}
        </div>
      )}

      {/* Alert list */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 max-h-56 sm:max-h-64">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <Bell className="w-8 h-8 mb-2" />
            <p className="text-sm font-medium">Chưa có cảnh báo nào</p>
            <p className="text-xs mt-1 text-center text-gray-400">
              AI sẽ thông báo khi bật/tắt đèn hoặc phát hiện bất thường
            </p>
          </div>
        ) : (
          alerts.map((msg: AiAdvicePayload, idx: number) => (
            <div key={`${msg.time}-${idx}`} className="space-y-1">
              <div className="text-[11px] text-gray-400 font-mono">{formatTime(msg.time)}</div>

              {/* Anomaly (cảnh báo ML) */}
              {msg.anomaly && (
                <div className={`flex items-start gap-2 rounded-lg border-l-4 px-3 py-2 text-sm ${alertBorderClass(msg.anomaly)}`}>
                  <span>{msg.anomaly}</span>
                </div>
              )}

              {/* Advice items */}
              {msg.advice.map((a, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2 rounded-lg border-l-4 px-3 py-2 text-sm ${alertBorderClass(a)}`}
                >
                  <span>{a}</span>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Footer hint */}
      <div className="px-4 py-2 border-t border-gray-100 text-[11px] text-gray-400 text-center">
        AI tự học theo thói quen sử dụng của bạn • Càng dùng lâu càng chính xác hơn
      </div>
    </div>
  );
}
