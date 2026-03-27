'use client';

import React from 'react';
import { useAiContext } from '@/contexts/AiContext';
import { useLanguage } from '@/contexts/LanguageContext';
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
  if (level === 'idle')   return 'bg-muted';
  if (level === 'normal') return 'bg-green-400';
  if (level === 'medium') return 'bg-yellow-400';
  return 'bg-red-400';
}
function badgeClass(level: ReturnType<typeof powerLevel>) {
  if (level === 'idle')   return 'bg-muted text-muted-foreground';
  if (level === 'normal') return 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300';
  if (level === 'medium') return 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
  return 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300';
}
function levelLabel(level: ReturnType<typeof powerLevel>, t: (key: string) => string) {
  if (level === 'idle')   return t('ai.idle');
  if (level === 'normal') return t('ai.normal');
  if (level === 'medium') return t('ai.medium');
  return t('ai.high');
}
function barPct(powerMw: number) {
  // Tỷ lệ thực tế theo thang 0–6000 mW
  return Math.min(Math.round((powerMw / 6000) * 100), 100);
}

function localizeAiText(text: string, language: 'vi' | 'en') {
  if (!text || language === 'vi') return text;

  const source = text.trim();

  if (/^🚨\s*Điện tiêu thụ đột ngột bất thường\s*[—–-]\s*vui lòng kiểm tra thiết bị trong nhà$/i.test(source)) {
    return '🚨 Abnormal sudden power consumption detected — please check devices in your home';
  }

  const turnedOn = source.match(/^💡\s*Đèn\s*(\d+)\s*vừa bật\s*[—–-]\s*điện tăng thêm\s*([\d.]+)\s*W\s*\(đang dùng:\s*([\d.]+)\s*W\)$/i);
  if (turnedOn) {
    return `💡 Light ${turnedOn[1]} just turned on — power increased by ${turnedOn[2]} W (now using: ${turnedOn[3]} W)`;
  }

  const turnedOff = source.match(/^💡\s*Đèn\s*(\d+)\s*vừa tắt\s*[—–-]\s*điện giảm\s*([\d.]+)\s*W\s*\(hiện tiêu thụ:\s*([\d.]+)\s*W\)$/i);
  if (turnedOff) {
    return `💡 Light ${turnedOff[1]} just turned off — power decreased by ${turnedOff[2]} W (current consumption: ${turnedOff[3]} W)`;
  }

  const changedCurrent = source.match(/^🔄\s*Đèn\s*(\d+)\s*thay đổi\s*[—–-]\s*điện tiêu thụ hiện tại:\s*([\d.]+)\s*W$/i);
  if (changedCurrent) {
    return `🔄 Light ${changedCurrent[1]} changed — current power consumption: ${changedCurrent[2]} W`;
  }

  const allOffNormal = source.match(/^✅\s*Đèn đã tắt hết\s*[—–-]\s*điện tiêu thụ thấp, bình thường\s*\(([\d.]+)\s*W\)$/i);
  if (allOffNormal) {
    return `✅ All lights are off — low power consumption, normal (${allOffNormal[1]} W)`;
  }

  const allOffButHigh = source.match(/^⚠️?\s*Điện vẫn cao dù đèn đã tắt hết\s*\(([\d.]+)\s*W,\s*mức thường:\s*~?([\d.]+)\s*W\)\s*[—–-]\s*có thiết bị nào quên tắt không\?$/i);
  if (allOffButHigh) {
    return `⚠️ Power is still high even though all lights are off (${allOffButHigh[1]} W, usual level: ~${allOffButHigh[2]} W) — did you forget to turn off another device?`;
  }

  const higherThanUsual = source.match(/^⚠️?\s*Điện cao hơn mức thường\s*([\d.]+)%\s*[—–-]\s*nên kiểm tra xem có thiết bị nào bật quên không\??$/i);
  if (higherThanUsual) {
    return `⚠️ Power is ${higherThanUsual[1]}% higher than usual — please check whether any device was left on`;
  }

  // ✅ Đèn X đang bật — mức điện bình thường (X W)
  const ledOnNormal = source.match(/^✅\s*(.+?)\s*đang bật\s*[—–-]\s*mức điện bình thường\s*\(([\d.]+)\s*W\)$/i);
  if (ledOnNormal) {
    const ledName = ledOnNormal[1]
      .replace(/Đèn\s*1\s*\+\s*Đèn\s*2/i, 'Light 1 + Light 2')
      .replace(/Đèn\s*(\d+)/gi, 'Light $1');
    return `✅ ${ledName} is on — normal power level (${ledOnNormal[2]} W)`;
  }

  // ✅ Đèn X đang bật — điện tiêu thụ X W (fallback format)
  const ledOnPower = source.match(/^✅\s*(.+?)\s*đang bật\s*[—–-]\s*điện tiêu thụ\s*([\d.]+)\s*W$/i);
  if (ledOnPower) {
    const ledName = ledOnPower[1]
      .replace(/Đèn\s*1\s*\+\s*Đèn\s*2/i, 'Light 1 + Light 2')
      .replace(/Đèn\s*(\d+)/gi, 'Light $1');
    return `✅ ${ledName} is on — power consumption: ${ledOnPower[2]} W`;
  }

  // 💡 Gợi ý: Tắt bớt đèn không cần thiết để tiết kiệm điện
  if (/^💡\s*Gợi ý:\s*Tắt bớt đèn không cần thiết để tiết kiệm điện$/i.test(source)) {
    return '💡 Suggestion: Turn off unnecessary lights to save energy';
  }

  // 🌙 Đèn vừa tắt — điện giảm X W (điện chờ hiện tại: X W)
  const lightsOff = source.match(/^🌙\s*Đèn vừa tắt\s*[—–-]\s*điện giảm\s*([\d.]+)\s*W\s*\(điện chờ hiện tại:\s*([\d.]+)\s*W\)$/i);
  if (lightsOff) {
    return `🌙 Lights just turned off — power decreased by ${lightsOff[1]} W (standby power: ${lightsOff[2]} W)`;
  }

  // 📊 AI đang làm quen với thiết bị của bạn... (X/Y)
  const aiLearning = source.match(/^📊\s*AI đang làm quen với thiết bị của bạn\.*\s*\((\d+)\/(\d+)\)$/i);
  if (aiLearning) {
    return `📊 AI is learning your devices... (${aiLearning[1]}/${aiLearning[2]})`;
  }

  // ⚠️ Điện vẫn cao dù đèn đã tắt (X W) — có thiết bị nào đang bật không?
  const stillHighNoHet = source.match(/^⚠️?\s*Điện vẫn cao dù đèn đã tắt\s*\(([\d.]+)\s*W\)\s*[—–-]\s*có thiết bị nào đang bật không\?$/i);
  if (stillHighNoHet) {
    return `⚠️ Power is still high even though lights are off (${stillHighNoHet[1]} W) — is another device still on?`;
  }

  // ✅ Đèn đã tắt — điện tiêu thụ thấp (X W)
  const allOffLow = source.match(/^✅\s*Đèn đã tắt\s*[—–-]\s*điện tiêu thụ thấp\s*\(([\d.]+)\s*W\)$/i);
  if (allOffLow) {
    return `✅ Lights are off — low power consumption (${allOffLow[1]} W)`;
  }

  // 🔋 Điện đang cao hơn mức thường X% — đang dùng X W thay vì ~X W như thường lệ
  const batteryHigher = source.match(/^🔋\s*Điện đang cao hơn mức thường\s*([\d.]+)%\s*[—–-]\s*đang dùng\s*([\d.]+)\s*W\s*thay vì\s*~?([\d.]+)\s*W\s*như thường lệ$/i);
  if (batteryHigher) {
    return `🔋 Power is ${batteryHigher[1]}% higher than usual — using ${batteryHigher[2]} W instead of ~${batteryHigher[3]} W as usual`;
  }

  return source
    .replace(/đang dùng:/gi, 'now using:')
    .replace(/hiện tiêu thụ:/gi, 'current consumption:')
    .replace(/Điện tiêu thụ đột ngột bất thường/gi, 'Abnormal sudden power consumption detected')
    .replace(/vui lòng kiểm tra thiết bị trong nhà/gi, 'please check devices in your home')
    .replace(/Đèn đã tắt hết\s*[—–-]\s*điện tiêu thụ thấp, bình thường/gi, 'All lights are off — low power consumption, normal')
    .replace(/Điện vẫn cao dù đèn đã tắt hết/gi, 'Power is still high even though all lights are off')
    .replace(/Điện cao hơn mức thường\s*([\d.]+)%/gi, 'Power is $1% higher than usual')
    .replace(/mức thường:/gi, 'usual level:')
    .replace(/có thiết bị nào quên tắt không\?/gi, 'did you forget to turn off another device?')
    .replace(/nên kiểm tra xem có thiết bị nào bật quên không\??/gi, 'please check whether any device was left on')
    .replace(/Đèn\s*(\d+)\s*thay đổi\s*[—–-]\s*điện tiêu thụ hiện tại:/gi, 'Light $1 changed — current power consumption:')
    .replace(/đang bật\s*[—–-]\s*mức điện bình thường/gi, 'is on — normal power level')
    .replace(/đang bật\s*[—–-]\s*điện tiêu thụ/gi, 'is on — power consumption:')
    .replace(/Gợi ý:\s*Tắt bớt đèn không cần thiết để tiết kiệm điện/gi, 'Suggestion: Turn off unnecessary lights to save energy')
    .replace(/Đèn vừa tắt\s*[—–-]\s*điện giảm/gi, 'Lights just turned off — power decreased by')
    .replace(/điện chờ hiện tại:/gi, 'standby power:')
    .replace(/AI đang làm quen với thiết bị của bạn/gi, 'AI is learning your devices')
    .replace(/Điện vẫn cao dù đèn đã tắt/gi, 'Power is still high even though lights are off')
    .replace(/có thiết bị nào đang bật không\?/gi, 'is another device still on?')
    .replace(/Đèn đã tắt\s*[—–-]\s*điện tiêu thụ thấp/gi, 'Lights are off — low power consumption')
    .replace(/Điện đang cao hơn mức thường/gi, 'Power is higher than usual')
    .replace(/đang dùng/gi, 'now using')
    .replace(/thay vì/gi, 'instead of')
    .replace(/như thường lệ/gi, 'as usual')
    .replace(/Đèn\s*(\d+)/gi, 'Light $1')
    .replace(/Tất cả đèn/gi, 'All lights');
}

function analysisBg(text: string) {
  if (/cảnh báo|bất thường|nguy cơ|cao|alert|abnormal|risk|high/i.test(text)) return 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800';
  if (/ổn định|an toàn|thành công|tốt|stable|safe|success|good/i.test(text)) return 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800';
  if (/khuyến nghị|tiết kiệm|theo dõi|tối ưu|recommend|saving|monitor|optimi/i.test(text)) return 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
  return 'bg-muted text-muted-foreground border-border';
}

function alertBorderClass(text: string): string {
  if (/cảnh báo|bất thường|nguy cơ|cao|alert|abnormal|risk|high/i.test(text))
    return 'border-red-400 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300';
  if (/khuyến nghị|tiết kiệm|theo dõi|tối ưu|recommend|saving|monitor|optimi/i.test(text))
    return 'border-green-400 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-900/20 dark:text-green-300';
  return 'border-blue-400 bg-blue-50 text-blue-800 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-300';
}

function formatTime(iso: string, language: 'vi' | 'en') {
  return new Date(iso).toLocaleTimeString(language === 'en' ? 'en-US' : 'vi-VN', {
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

function PowerGauge({ powerMw, led1, led2, t }: { powerMw: number; led1: boolean; led2: boolean; t: (key: string) => string }) {
  const level = powerLevel(powerMw);
  const { value, unit } = formatPower(powerMw);

  return (
    <div className="px-4 py-3 border-b border-border">
      {/* Top row: value + badge */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-2xl font-bold ${
            level === 'idle'   ? 'text-gray-400 dark:text-gray-500' :
            level === 'normal' ? 'text-green-600 dark:text-green-400' :
            level === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
            'text-red-600 dark:text-red-400'
          }`}>{value}</span>
          <span className="text-sm text-muted-foreground font-medium">{unit}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${badgeClass(level)}`}>
            {levelLabel(level, t)}
          </span>
        </div>
        {/* LED state indicators */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] sm:text-xs">
          <span className={`px-2 py-0.5 rounded-full font-medium transition-colors ${
            led1 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-muted text-muted-foreground'
          }`}>
            <span className="inline-flex items-center gap-1"><Lightbulb className="w-3 h-3" />{t('ai.led1')}</span>
          </span>
          <span className={`px-2 py-0.5 rounded-full font-medium transition-colors ${
            led2 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-muted text-muted-foreground'
          }`}>
            <span className="inline-flex items-center gap-1"><Lightbulb className="w-3 h-3" />{t('ai.led2')}</span>
          </span>
        </div>
      </div>
      {/* Progress bar */}
      <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
        <div
          className={`h-3 rounded-full transition-all duration-700 ease-out ${barClass(level)}`}
          style={{ width: `${barPct(powerMw)}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
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
  const { t, language } = useLanguage();
  const localizedAnalysis = status ? localizeAiText(status.analysis, language) : '';

  return (
    <div className="section-card border border-border rounded-xl shadow-sm flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center flex-wrap gap-2">
          <Bot className="w-5 h-5 text-foreground/80" />
          <span className="text-sm sm:text-base font-semibold text-foreground">{t('ai.title')}</span>
          {isConnected ? (
            <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              {t('ai.live')}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-medium">
              <span className="w-2 h-2 rounded-full bg-muted-foreground" />
              {t('ai.offline')}
            </span>
          )}
        </div>
        {alerts.length > 0 && (
          <button
            onClick={clear}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('ai.clearAll')}
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
            t={t}
          />
        );
      })() : (
        <div className="px-4 py-3 border-b border-border text-sm text-muted-foreground inline-flex items-center gap-2">
          <Activity className="w-4 h-4" />
          {t('ai.waitingData')}
        </div>
      )}

      {/* Live analysis text */}
      {status && (
        <div className={`px-4 py-2 border-b text-sm font-medium transition-colors ${analysisBg(localizedAnalysis)}`}>
          {localizedAnalysis}
        </div>
      )}

      {/* Alert list */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 max-h-56 sm:max-h-64">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Bell className="w-8 h-8 mb-2" />
            <p className="text-sm font-medium">{t('ai.noAlerts')}</p>
            <p className="text-xs mt-1 text-center text-muted-foreground">
              {t('ai.alertHint')}
            </p>
          </div>
        ) : (
          alerts.map((msg: AiAdvicePayload, idx: number) => (
            <div key={`${msg.time}-${idx}`} className="space-y-1">
              <div className="text-[11px] text-muted-foreground font-mono">{formatTime(msg.time, language)}</div>

              {/* Anomaly (cảnh báo ML) */}
              {msg.anomaly && (() => {
                const localizedAnomaly = localizeAiText(msg.anomaly, language);
                return (
                  <div className={`flex items-start gap-2 rounded-lg border-l-4 px-3 py-2 text-sm ${alertBorderClass(localizedAnomaly)}`}>
                    <span>{localizedAnomaly}</span>
                  </div>
                );
              })()}

              {/* Advice items */}
              {msg.advice.map((a, i) => (
                (() => {
                  const localizedAdvice = localizeAiText(a, language);
                  return (
                <div
                  key={i}
                  className={`flex items-start gap-2 rounded-lg border-l-4 px-3 py-2 text-sm ${alertBorderClass(localizedAdvice)}`}
                >
                  <span>{localizedAdvice}</span>
                </div>
                  );
                })()
              ))}
            </div>
          ))
        )}
      </div>

      {/* Footer hint */}
      <div className="px-4 py-2 border-t border-border text-[11px] text-muted-foreground text-center">
        {t('ai.footer')}
      </div>
    </div>
  );
}
