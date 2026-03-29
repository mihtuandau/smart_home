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
import { apiClient } from '@/lib/api';
import type { AiAdvicePayload, LedDayEntry } from '@/hooks/useSocket';

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

interface AiContextValue {
  status: AiAdvicePayload | null;
  alerts: AiAdvicePayload[];
  clearAlerts: () => void;
  todayLed: LedDayEntry;
  ledHistory: LedDayEntry[];
  ledHistoryLoading: boolean;
}

const AiContext = createContext<AiContextValue>({
  status: null,
  alerts: [],
  clearAlerts: () => {},
  todayLed: { ...EMPTY_LED_DAY },
  ledHistory: [],
  ledHistoryLoading: true,
});

export function AiProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus]         = useState<AiAdvicePayload | null>(null);
  const [alerts, setAlerts]         = useState<AiAdvicePayload[]>(() => loadAlertsFromStorage());
  const [todayLed, setTodayLed]     = useState<LedDayEntry>({ ...EMPTY_LED_DAY });
  const [ledHistory, setLedHistory] = useState<LedDayEntry[]>([]);
  const [ledHistoryLoading, setLedHistoryLoading] = useState(true);

  const fetchLedHistory = useCallback(async () => {
    try {
      const res = await apiClient.request<{ days: number; data: LedDayEntry[] }>(
        '/ai/led-daily?days=30',
      );
      if (res.data) setLedHistory(res.data);
    } catch {
    } finally {
      setLedHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLedHistory();
    const id = setInterval(fetchLedHistory, HISTORY_REFRESH_MS);
    return () => clearInterval(id);
  }, [fetchLedHistory]);

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
    const handler = (payload: AiAdvicePayload) => handleRef.current?.(payload);
    socketService.onAiAdvice(handler);
    return () => socketService.offAiAdvice(handler);
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
    saveAlertsToStorage([]);
  }, []);

  return (
    <AiContext.Provider value={{ status, alerts, clearAlerts, todayLed, ledHistory, ledHistoryLoading }}>
      {children}
    </AiContext.Provider>
  );
}

export function useAiContext() {
  return useContext(AiContext);
}
