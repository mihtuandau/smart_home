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
import type { AiAdvicePayload } from '@/hooks/useSocket';

const MAX_ALERTS = 50;
/** Key localStorage gồm ngày hôm nay → sang ngày mới tự thành key khác → data cũ bị bỏ qua */
const storageKey = () => `ai_alerts_${new Date().toISOString().slice(0, 10)}`; // "ai_alerts_2026-03-05"

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
    // Xóa key của các ngày cũ để không chiếm dung lượng
    Object.keys(localStorage)
      .filter((k) => k.startsWith('ai_alerts_') && k !== storageKey())
      .forEach((k) => localStorage.removeItem(k));
    localStorage.setItem(storageKey(), JSON.stringify(alerts));
  } catch {
    // localStorage bị block (private mode, storage full) — bỏ qua
  }
}

interface AiContextValue {
  status: AiAdvicePayload | null;
  alerts: AiAdvicePayload[];
  clearAlerts: () => void;
}

const AiContext = createContext<AiContextValue>({
  status: null,
  alerts: [],
  clearAlerts: () => {},
});

/**
 * Bọc toàn bộ app — subscribe socket AI một lần duy nhất.
 * - Dữ liệu tồn tại khi điều hướng giữa các trang (AiContext)
 * - Alerts được lưu localStorage theo ngày → mở lại app vẫn thấy
 * - Tự xóa khi sang ngày mới (key khác)
 */
export function AiProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AiAdvicePayload | null>(null);
  // Khởi tạo từ localStorage ngay lập tức
  const [alerts, setAlerts] = useState<AiAdvicePayload[]>(() => loadAlertsFromStorage());

  const handleRef = useRef<((p: AiAdvicePayload) => void) | null>(null);

  handleRef.current = (payload: AiAdvicePayload) => {
    setStatus(payload);
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
    <AiContext.Provider value={{ status, alerts, clearAlerts }}>
      {children}
    </AiContext.Provider>
  );
}

/** Hook dùng trong bất kỳ component nào — data không bị mất khi chuyển trang */
export function useAiContext() {
  return useContext(AiContext);
}
