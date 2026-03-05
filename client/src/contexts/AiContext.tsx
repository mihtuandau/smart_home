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
/** Alert key theo ngày — tự xóa khi sang ngày mới */
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
  } catch { /* ignore */ }
}

// ── Constants ──────────────────────────────────────────────────────────────────

const EMPTY_LED_DAY: LedDayEntry = {
  date: '',
  led1_wh: 0,
  led2_wh: 0,
  led1_on_minutes: 0,
  led2_on_minutes: 0,
};

/** Refresh lịch sử LED từ REST mỗi 5 phút */
const HISTORY_REFRESH_MS = 5 * 60 * 1000;

// ── Context types ──────────────────────────────────────────────────────────────

interface AiContextValue {
  status: AiAdvicePayload | null;
  alerts: AiAdvicePayload[];
  clearAlerts: () => void;
  /**
   * Tiêu thụ LED hôm nay — server tính chính xác qua delta time,
   * cập nhật realtime mỗi MQTT message qua socket.
   */
  todayLed: LedDayEntry;
  /**
   * Lịch sử N ngày gần nhất — lấy từ REST /ai/led-daily, refresh mỗi 5 phút.
   * Bao gồm cả hôm nay (server merge in-memory).
   */
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

// ── Provider ───────────────────────────────────────────────────────────────────

/**
 * Bọc toàn bộ app — subscribe socket AI một lần duy nhất.
 *
 * - `todayLed`   : server tích lũy theo delta time thực tế → emit qua socket
 * - `ledHistory` : lấy từ REST (persist DB), tự refresh 5 phút/lần
 * - Alerts        : lưu localStorage theo ngày, tự xóa sang ngày mới
 */
export function AiProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus]         = useState<AiAdvicePayload | null>(null);
  const [alerts, setAlerts]         = useState<AiAdvicePayload[]>(() => loadAlertsFromStorage());
  const [todayLed, setTodayLed]     = useState<LedDayEntry>({ ...EMPTY_LED_DAY });
  const [ledHistory, setLedHistory] = useState<LedDayEntry[]>([]);
  const [ledHistoryLoading, setLedHistoryLoading] = useState(true);

  // ── Fetch LED history từ REST ────────────────────────────────────────────────

  const fetchLedHistory = useCallback(async () => {
    try {
      const res = await apiClient.request<{ days: number; data: LedDayEntry[] }>(
        '/ai/led-daily?days=30',
      );
      if (res.data) setLedHistory(res.data);
    } catch {
      // Giữ data cũ nếu lỗi mạng
    } finally {
      setLedHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLedHistory();
    const id = setInterval(fetchLedHistory, HISTORY_REFRESH_MS);
    return () => clearInterval(id);
  }, [fetchLedHistory]);

  // ── Socket handler ─────────────────────────────────────────────────────────

  const handleRef = useRef<((p: AiAdvicePayload) => void) | null>(null);

  handleRef.current = (payload: AiAdvicePayload) => {
    setStatus(payload);

    // dailyLed do server tính — không cần accumulate client-side
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

/** Hook dùng trong bất kỳ component nào — data không bị mất khi chuyển trang */
export function useAiContext() {
  return useContext(AiContext);
}
