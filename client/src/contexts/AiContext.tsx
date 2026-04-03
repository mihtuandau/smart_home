'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { socketService } from '@/lib/socket';
import { aiApi } from '@/lib/api/ai';
import type { AiAdvicePayload, LedDayEntry } from '@/hooks/socket';

const MAX_ALERTS = 50;
const storageKey = () => `ai_alerts_${new Date().toISOString().slice(0, 10)}`;

function loadAlertsFromStorage(): AiAdvicePayload[] {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return [];
    return JSON.parse(raw) as AiAdvicePayload[];
  } catch {
    return [];
  }
}

function saveAlertsToStorage(alerts: AiAdvicePayload[]) {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('ai_alerts_') && k !== storageKey())
      .forEach((k) => localStorage.removeItem(k));
    localStorage.setItem(storageKey(), JSON.stringify(alerts));
  } catch {}
}

const EMPTY_LED_DAY: LedDayEntry = {
  date: '',
  led1_wh: 0,
  led2_wh: 0,
  led1_on_minutes: 0,
  led2_on_minutes: 0,
};

const HISTORY_REFRESH_MS = 5 * 60 * 1000;
const STATUS_REFRESH_MS = 15 * 1000;
const BASELINE_REFRESH_MS = 10 * 60 * 1000;

function isAiAdvicePayload(value: unknown): value is AiAdvicePayload {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.time === 'string' &&
    Array.isArray(obj.advice) &&
    typeof obj.analysis === 'string' &&
    (obj.type === 'status' || obj.type === 'alert')
  );
}

interface AiContextValue {
  status: AiAdvicePayload | null;
  alerts: AiAdvicePayload[];
  clearAlerts: () => void;
  todayLed: LedDayEntry;
  ledHistory: LedDayEntry[];
  ledHistoryLoading: boolean;
  baseline: Record<string, unknown> | null;
  baselineLoading: boolean;
}

const AiContext = createContext<AiContextValue>({
  status: null,
  alerts: [],
  clearAlerts: () => {},
  todayLed: { ...EMPTY_LED_DAY },
  ledHistory: [],
  ledHistoryLoading: true,
  baseline: null,
  baselineLoading: true,
});

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {};
}

function toAiPayload(value: unknown): AiAdvicePayload | null {
  const obj = toRecord(value);
  if (typeof obj.time !== 'string' || typeof obj.analysis !== 'string') {
    return null;
  }

  const advice = Array.isArray(obj.advice)
    ? obj.advice.filter((item): item is string => typeof item === 'string')
    : [];

  const anomaly = typeof obj.anomaly === 'string' ? obj.anomaly : null;
  const dailyRaw = toRecord(obj.dailyLed);
  const dailyLed: LedDayEntry = {
    date: typeof dailyRaw.date === 'string' ? dailyRaw.date : '',
    led1_wh: typeof dailyRaw.led1_wh === 'number' ? dailyRaw.led1_wh : 0,
    led2_wh: typeof dailyRaw.led2_wh === 'number' ? dailyRaw.led2_wh : 0,
    led1_on_minutes:
      typeof dailyRaw.led1_on_minutes === 'number' ? dailyRaw.led1_on_minutes : 0,
    led2_on_minutes:
      typeof dailyRaw.led2_on_minutes === 'number' ? dailyRaw.led2_on_minutes : 0,
  };

  return {
    time: obj.time,
    analysis: obj.analysis,
    anomaly,
    advice,
    type: advice.length > 0 || anomaly ? 'alert' : 'status',
    powerW: typeof obj.powerW === 'number' ? obj.powerW : 0,
    led1: typeof obj.led1 === 'boolean' ? obj.led1 : false,
    led2: typeof obj.led2 === 'boolean' ? obj.led2 : false,
    dailyLed,
  };
}

export function AiProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AiAdvicePayload | null>(null);
  const [alerts, setAlerts] = useState<AiAdvicePayload[]>(() =>
    loadAlertsFromStorage(),
  );
  const [todayLed, setTodayLed] = useState<LedDayEntry>({ ...EMPTY_LED_DAY });
  const [ledHistory, setLedHistory] = useState<LedDayEntry[]>([]);
  const [ledHistoryLoading, setLedHistoryLoading] = useState(true);
  const [baseline, setBaseline] = useState<Record<string, unknown> | null>(
    null,
  );
  const [baselineLoading, setBaselineLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await aiApi.getStatus();
      const payload = toAiPayload(res);
      if (!payload) return;

      setStatus((prev) => {
        if (prev && prev.time === payload.time) {
          return prev;
        }
        return payload;
      });

      if (payload.dailyLed) {
        setTodayLed(payload.dailyLed);
      }
    } catch {
    }
  }, []);

  const fetchBaseline = useCallback(async () => {
    try {
      const res = await aiApi.getBaseline();
      setBaseline(toRecord(res));
    } catch {
    } finally {
      setBaselineLoading(false);
    }
  }, []);

  const fetchLedHistory = useCallback(async () => {
    try {
      const res = await aiApi.getLedDaily(30);
      const data = toRecord(res).data;
      setLedHistory(Array.isArray(data) ? (data as LedDayEntry[]) : []);
    } catch {
    } finally {
      setLedHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchBaseline();
    fetchLedHistory();
    const statusId = setInterval(fetchStatus, STATUS_REFRESH_MS);
    const baselineId = setInterval(fetchBaseline, BASELINE_REFRESH_MS);
    const historyId = setInterval(fetchLedHistory, HISTORY_REFRESH_MS);
    return () => {
      clearInterval(statusId);
      clearInterval(baselineId);
      clearInterval(historyId);
    };
  }, [fetchBaseline, fetchLedHistory, fetchStatus]);

  const handleRef = useRef<((p: AiAdvicePayload) => void) | null>(null);

  handleRef.current = (payload: AiAdvicePayload) => {
    setStatus(payload);

    if (payload.dailyLed) {
      setTodayLed(payload.dailyLed);
    }

    if (payload.type === 'alert') {
      setAlerts((prev) => {
        const next = [payload, ...prev].slice(0, MAX_ALERTS);
        saveAlertsToStorage(next);
        return next;
      });
    }
  };

  useEffect(() => {
    const handler = (payload: unknown) => {
      if (isAiAdvicePayload(payload)) {
        handleRef.current?.(payload);
      }
    };
    socketService.onAiAdvice(handler);
    return () => socketService.offAiAdvice(handler);
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
    saveAlertsToStorage([]);
  }, []);

  return (
    <AiContext.Provider
      value={{
        status,
        alerts,
        clearAlerts,
        todayLed,
        ledHistory,
        ledHistoryLoading,
        baseline,
        baselineLoading,
      }}
    >
      {children}
    </AiContext.Provider>
  );
}

export function useAiContext() {
  return useContext(AiContext);
}
