'use client';

import React from 'react';
import { useAiContext } from '@/contexts/AiContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSocket } from '@/hooks/socket';
import { Language } from '@/i18n';
import { localizeAiText } from '@/lib/aiTextLocalization';
import type { AiAdvicePayload } from '@/hooks/socket';
import { Activity, Bell, Bot, Lightbulb } from 'lucide-react';

const dateLocaleMap = {
  vi: 'vi-VN',
  en: 'en-US',
  zh: 'zh-CN',
} as const;

function powerLevel(mw: number): 'idle' | 'normal' | 'medium' | 'high' {
  if (mw < 300)  return 'idle';
  if (mw < 1500) return 'normal';
  if (mw < 2800) return 'normal';
  if (mw < 4000) return 'medium';
  return 'high';
}

function parseMwFromText(text: string): number | null {
  const mwMatch = text.match(/(\d+(?:\.\d+)?)\s*mW/i);
  if (mwMatch) return parseFloat(mwMatch[1]);
  const wMatch = text.match(/(\d+(?:\.\d+)?)\s*W(?!h)/i);
  if (wMatch) return parseFloat(wMatch[1]) * 1000;
  return null;
}

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
  return Math.min(Math.round((powerMw / 6000) * 100), 100);
}

function analysisBg(text: string) {
  if (/cảnh báo|bất thường|nguy cơ|cao|alert|abnormal|risk|high|higher|警告|异常|风险|危险|burning money|peak load|red alert|prioritize|reducing power/i.test(text)) return 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800';
  if (/ổn định|an toàn|thành công|tốt|bình thường|thấp|vừa tắt|đã tắt|giảm|stable|safe|success|good|normal|low|turned off|are off|decreased|稳定|安全|成功|好|正常|关闭|下降|savings/i.test(text)) return 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800';
  if (/khuyến nghị|gợi ý|tiết kiệm|theo dõi|tối ưu|đang làm quen|nhắc nhở|vừa bật|đang bật|đang dùng|hiện tiêu thụ|thay đổi|tăng|recommend|suggestion|saving|save|monitor|optimi|learning|turned on|is on|using|changed|increased|建议|节能|监控|优化|提示|开启|变化|增加|detected|remember|turn off|lights/i.test(text)) return 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
  return 'bg-muted text-muted-foreground border-border';
}

function alertBorderClass(text: string): string {
  if (/cảnh báo|bất thường|nguy cơ|cao|alert|abnormal|risk|high|higher|警告|异常|风险|危险|burning money|peak load|red alert|prioritize|reducing power/i.test(text))
    return 'border-red-400 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300';
  if (/ổn định|an toàn|thành công|tốt|bình thường|thấp|vừa tắt|đã tắt|giảm|stable|safe|success|good|normal|low|turned off|are off|decreased|稳定|安全|成功|好|正常|关闭|下降|savings/i.test(text))
    return 'border-green-400 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-900/20 dark:text-green-300';
  if (/khuyến nghị|gợi ý|tiết kiệm|theo dõi|tối ưu|đang làm quen|nhắc nhở|vừa bật|đang bật|đang dùng|hiện tiêu thụ|thay đổi|tăng|recommend|suggestion|saving|save|monitor|optimi|learning|turned on|is on|using|changed|increased|建议|节能|监控|优化|提示|开启|变化|增加|detected|remember|turn off|lights/i.test(text))
    return 'border-blue-400 bg-blue-50 text-blue-800 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-300';
  return 'border-muted-foreground bg-muted/50 text-muted-foreground dark:bg-muted/10';
}

function formatTime(iso: string, language: Language) {
  return new Date(iso).toLocaleTimeString(dateLocaleMap[language], {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function formatPower(mw: number): { value: string; unit: string } {
  if (mw < 1000) return { value: Math.round(mw).toString(), unit: 'mW' };
  const w = mw / 1000;
  return { value: parseFloat(w.toFixed(2)).toString(), unit: 'W' };
}


function PowerGauge({ powerMw, led1, led2, t }: { powerMw: number; led1: boolean; led2: boolean; t: (key: string) => string }) {
  const level = powerLevel(powerMw);
  const { value, unit } = formatPower(powerMw);

  return (
    <div className="px-4 py-3 border-b border-border">

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

export default function AIInsights() {
  const { isConnected } = useSocket();
  const {
    status,
    alerts,
    clearAlerts: clear,
  } = useAiContext();
  const { t, language } = useLanguage();
  const localizedAnalysis = status ? localizeAiText(status.analysis, language) : '';

  return (
    <div className="section-card border border-border rounded-xl shadow-sm flex flex-col h-full">

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

      {status && (
        <div className={`px-4 py-2 border-b text-sm font-medium transition-colors ${analysisBg(localizedAnalysis)}`}>
          {localizedAnalysis}
        </div>
      )}

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

              {msg.anomaly && (() => {
                const localizedAnomaly = localizeAiText(msg.anomaly, language);
                return (
                  <div className={`flex items-start gap-2 rounded-lg border-l-4 px-3 py-2 text-sm ${alertBorderClass(localizedAnomaly)}`}>
                    <span>{localizedAnomaly}</span>
                  </div>
                );
              })()}

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

      <div className="px-4 py-2 border-t border-border text-[11px] text-muted-foreground text-center">
        {t('ai.footer')}
      </div>
    </div>
  );
}
