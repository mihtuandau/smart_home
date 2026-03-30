'use client';

import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useAiContext } from '@/contexts/AiContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Language } from '@/i18n';
import type { LedDayEntry } from '@/hooks/socket';
import { Lightbulb, Zap } from 'lucide-react';

export const LED1_POWER_W = 0.5;
export const LED2_POWER_W = 0.8;

const SEED_DAYS = [
  { led1_min: 268, led2_min: 0   },
  { led1_min: 173, led2_min: 1   },
  { led1_min: 720, led2_min: 660 },
  { led1_min: 420, led2_min: 300 },
  { led1_min: 95,  led2_min: 45  },
  { led1_min: 510, led2_min: 480 },
  { led1_min: 330, led2_min: 210 },
];

function buildSeedHistory(): LedDayEntry[] {
  const today = new Date();
  return SEED_DAYS.map((s, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (SEED_DAYS.length - i));
    return {
      date:              d.toISOString().slice(0, 10),
      led1_wh:           parseFloat(((s.led1_min / 60) * LED1_POWER_W).toFixed(4)),
      led2_wh:           parseFloat(((s.led2_min / 60) * LED2_POWER_W).toFixed(4)),
      led1_on_minutes:   s.led1_min,
      led2_on_minutes:   s.led2_min,
    };
  });
}

function shortDate(iso: string): string {
  if (!iso) return '';
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

function formatWh(wh: number): string {
  if (wh === 0) return '0 Wh';
  return wh >= 1 ? `${wh.toFixed(2)} Wh` : `${(wh * 1000).toFixed(0)} mWh`;
}

function formatMin(min: number, language: Language): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (language === 'en') {
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h} h`;
    return `${h}h ${m}m`;
  }
  if (language === 'zh') {
    if (h === 0) return `${m} 分钟`;
    if (m === 0) return `${h} 小时`;
    return `${h}小时 ${m}分钟`;
  }
  if (h === 0) return `${m} phút`;
  if (m === 0) return `${h} giờ`;
  return `${h}g ${m}p`;
}

interface TooltipEntry {
  dataKey: string;
  color: string;
  name: string;
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
  mode: 'wh' | 'minutes';
}

function CustomTooltip({ active, payload, label, mode }: CustomTooltipProps) {
  const { language } = useLanguage();
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-foreground/80 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }} className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          {p.name}: {mode === 'wh' ? formatWh(p.value) : formatMin(p.value, language)}
        </p>
      ))}
    </div>
  );
}

function MiniStat({
  label,
  wh,
  minutes,
  color,
  isOn,
  language,
  t,
}: {
  label: string;
  wh: number;
  minutes: number;
  color: string;
  isOn: boolean;
  language: Language;
  t: (key: string) => string;
}) {
  return (
    <div className={`rounded-xl border ${isOn ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-950' : 'border-border bg-muted'} px-4 py-3 flex flex-col gap-1`}>
      <div className="flex items-center gap-2">
        <Lightbulb className="w-4 h-4" />
        <span className="text-sm font-semibold text-foreground/80">{label}</span>
        {isOn ? (
          <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium animate-pulse">
            {t('devices.on')}
          </span>
        ) : (
          <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
            {t('devices.off')}
          </span>
        )}
      </div>
      <div className="flex items-end justify-between mt-1">
        <div>
          <span className={`text-xl font-bold ${isOn ? 'text-yellow-600' : 'text-muted-foreground'}`}>
            {formatWh(wh)}
          </span>
          <p className="text-[11px] text-gray-400 mt-0.5">{formatMin(minutes, language)} {t('energy.today')}</p>
        </div>

        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden self-center">
          <div
            className="h-2 rounded-full transition-all duration-700"
            style={{ width: `${Math.min((wh / 4) * 100, 100)}%`, background: color }}
          />
        </div>
      </div>
    </div>
  );
}

export default function LedConsumptionChart() {
  const { todayLed, ledHistory, ledHistoryLoading, status } = useAiContext();
  const { t, language } = useLanguage();
  const [mode, setMode] = useState<'wh' | 'minutes'>('wh');

  const { chartData, totalLed1Wh, totalLed2Wh, totalLed1Min, totalLed2Min } = useMemo(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    const baseHistory: LedDayEntry[] =
      ledHistory.length > 0 ? ledHistory : buildSeedHistory();

    const byDate = new Map<string, LedDayEntry>();
    for (const row of baseHistory) byDate.set(row.date, row);

    byDate.set(todayKey, {
      date:             todayKey,
      led1_wh:          todayLed.led1_wh,
      led2_wh:          todayLed.led2_wh,
      led1_on_minutes:  todayLed.led1_on_minutes,
      led2_on_minutes:  todayLed.led2_on_minutes,
    });

    const chartRows = Array.from(byDate.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7);

    const data = chartRows.map((entry) => ({
      date:         shortDate(entry.date),
      fullDate:     entry.date,
      led1_wh:      parseFloat(entry.led1_wh.toFixed(4)),
      led2_wh:      parseFloat(entry.led2_wh.toFixed(4)),
      led1_minutes: parseFloat(entry.led1_on_minutes.toFixed(1)),
      led2_minutes: parseFloat(entry.led2_on_minutes.toFixed(1)),
    }));

    const total1Wh = data.reduce((s, d) => s + d.led1_wh, 0);
    const total2Wh = data.reduce((s, d) => s + d.led2_wh, 0);
    const total1Min = data.reduce((s, d) => s + d.led1_minutes, 0);
    const total2Min = data.reduce((s, d) => s + d.led2_minutes, 0);

    return {
      chartData: data,
      totalLed1Wh: total1Wh,
      totalLed2Wh: total2Wh,
      totalLed1Min: total1Min,
      totalLed2Min: total2Min,
    };
  }, [ledHistory, todayLed]);

  return (
    <div className="section-card border border-border rounded-xl shadow-sm flex flex-col h-full">

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-yellow-100 flex items-center justify-center">
            <Zap className="w-4 h-4 text-yellow-700" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">{t('dashboard.ledConsumptionDaily')}</h2>

          </div>
        </div>
        <div className="flex items-center gap-2">

          {ledHistoryLoading ? (
            <span className="text-[10px] text-gray-400 animate-pulse">{t('common.loading')}</span>
          ) : ledHistory.length > 0 ? (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-50 text-green-600 font-medium"></span>
          ) : (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400 font-medium">{t('dashboard.sample')}</span>
          )}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
          <button
            onClick={() => setMode('wh')}
            className={`px-2 py-1 text-xs rounded-md font-medium transition-colors ${
              mode === 'wh' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Wh
          </button>
          <button
            onClick={() => setMode('minutes')}
            className={`px-2 py-1 text-xs rounded-md font-medium transition-colors ${
              mode === 'minutes' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('dashboard.minutes')}
          </button>
        </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-4 pt-3 pb-2">
        <MiniStat
          label={t('ai.led1')}
          wh={todayLed.led1_wh}
          minutes={todayLed.led1_on_minutes}
          color="#f59e0b"
          isOn={status?.led1 ?? false}
          language={language}
          t={t}
        />
        <MiniStat
          label={t('ai.led2')}
          wh={todayLed.led2_wh}
          minutes={todayLed.led2_on_minutes}
          color="#3b82f6"
          isOn={status?.led2 ?? false}
          language={language}
          t={t}
        />
      </div>

      <div className="px-2 pb-2 flex-1 min-h-[160px] sm:min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              barCategoryGap="25%"
              barGap={2}
              margin={{ top: 4, right: 8, bottom: 0, left: -10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip mode={mode} />} />
              <Legend
                iconType="circle"
                iconSize={7}
                wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }}
              />
              {mode === 'wh' ? (
                <>
                  <Bar dataKey="led1_wh"      name={`${t('ai.led1')} (Wh)`}   fill="#f59e0b" radius={[3,3,0,0]} />
                  <Bar dataKey="led2_wh"      name={`${t('ai.led2')} (Wh)`}   fill="#3b82f6" radius={[3,3,0,0]} />
                </>
              ) : (
                <>
                  <Bar dataKey="led1_minutes" name={`${t('ai.led1')} (${t('dashboard.minutes').toLowerCase()})`} fill="#f59e0b" radius={[3,3,0,0]} />
                  <Bar dataKey="led2_minutes" name={`${t('ai.led2')} (${t('dashboard.minutes').toLowerCase()})`} fill="#3b82f6" radius={[3,3,0,0]} />
                </>
              )}
            </BarChart>
          </ResponsiveContainer>
      </div>

      <div className="px-4 py-2 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
        {mode === 'wh' ? (
          <>
            <span>
              {t('dashboard.last7Days')} · {t('ai.led1')}:{' '}
              <span className="text-yellow-600 font-medium">{formatWh(totalLed1Wh)}</span>
              {'  '}{t('ai.led2')}:{' '}
              <span className="text-blue-500 font-medium">{formatWh(totalLed2Wh)}</span>
            </span>
            <span>
              {t('dashboard.total')}: <span className="text-foreground font-semibold">{formatWh(totalLed1Wh + totalLed2Wh)}</span>
            </span>
          </>
        ) : (
          <>
            <span>
              {t('dashboard.last7Days')} · {t('ai.led1')}:{' '}
              <span className="text-yellow-600 font-medium">{formatMin(totalLed1Min, language)}</span>
              {'  '}{t('ai.led2')}:{' '}
              <span className="text-blue-500 font-medium">{formatMin(totalLed2Min, language)}</span>
            </span>
            <span>
              {t('dashboard.total')}: <span className="text-foreground font-semibold">{formatMin(totalLed1Min + totalLed2Min, language)}</span>
            </span>
          </>
        )}
      </div>
    </div>
  );
}
