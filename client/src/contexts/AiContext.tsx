"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { socketService } from "@/lib/socket";

export interface LedDayEntry {
  date: string;
  led1_wh: number;
  led2_wh: number;
  led1_on_minutes: number;
  led2_on_minutes: number;
}

export interface AiAdvicePayload {
  time: string;
  severity: "low" | "medium" | "high";
  status_text: string;
  analysis: string;
  tips: string[];
  advice: string[]; // for backward compatibility
  is_critical: boolean;
  has_new_alert: boolean;
  score: number;
  powerW?: number;
  led1?: boolean;
  led2?: boolean;
  anomaly?: string;
  type?: string;
}

interface AiContextType {
  status: AiAdvicePayload | null;
  alerts: AiAdvicePayload[];
  todayLed: LedDayEntry;
  ledHistory: LedDayEntry[];
  ledHistoryLoading: boolean;
  clearAlerts: () => void;
}

const AiContext = createContext<AiContextType | undefined>(undefined);

const DEFAULT_TODAY_LED: LedDayEntry = {
  date: new Date().toISOString().slice(0, 10),
  led1_wh: 0,
  led2_wh: 0,
  led1_on_minutes: 0,
  led2_on_minutes: 0,
};

export function AiProvider({ children }: { children: React.ReactNode }) {
  const socket = socketService.getSocket() || socketService.connect();
  const [status, setStatus] = useState<AiAdvicePayload | null>(null);
  const [alerts, setAlerts] = useState<AiAdvicePayload[]>([]);
  const [todayLed, setTodayLed] = useState<LedDayEntry>(DEFAULT_TODAY_LED);
  const [ledHistory, setLedHistory] = useState<LedDayEntry[]>([]);
  const [ledHistoryLoading, setLedHistoryLoading] = useState(false);

  const toAiPayload = useCallback((data: any): AiAdvicePayload => {
    const tips = Array.isArray(data.tips) ? data.tips : 
                 Array.isArray(data.advice) ? data.advice : [];
    
    return {
      time: data.time || new Date().toISOString(),
      severity: data.severity || (data.type === 'alert' ? 'high' : 'low'),
      status_text: data.status_text || (data.type === 'alert' ? 'Cảnh báo' : 'Ổn định'),
      analysis: data.analysis || '',
      tips: tips,
      advice: tips,
      is_critical: data.is_critical || data.isNewAlert || (data.type === 'alert') || false,
      has_new_alert: data.has_new_alert || data.isNewAlert || (data.type === 'alert') || false,
      score: typeof data.score === 'number' ? data.score : 0,
      powerW: data.powerW,
      led1: data.led1,
      led2: data.led2,
      anomaly: data.anomaly,
      type: data.type
    };
  }, []);

  useEffect(() => {
    const socket = socketService.getSocket() || socketService.connect();
    console.log("📡 AiProvider: Listening for AI events...");

    socket.on("connect", () => {
      console.log("🟢 Socket.io Connected! (AI & LED)");
    });

    socket.on("disconnect", (reason) => {
      console.warn("🔴 Socket.io Disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Socket.io Connection Error:", err.message);
    });

    const handleAdvice = (data: any) => {
      console.log("🤖 AI Insight Received:", data);
      const payload = toAiPayload(data);
      setStatus(payload);
      
      // Only add to history if it's a real alert/anomaly and NOT a routine status update
      const shouldLog = (payload.has_new_alert || payload.is_critical) && payload.type !== "status";

      if (shouldLog) {
        setAlerts((prev) => {
          // Deduplication: Strip trailing power values (e.g., "(39.8 W)") before comparing
          const cleanAnalysis = (text: string) => text.replace(/\s*\(\d+(\.\d+)?\s*W\)\s*$/, "").trim();
          const incomingClean = cleanAnalysis(payload.analysis);
          
          // Check if this alert is identical to ANY of the last 3 entries 
          // to prevent alternating alerts from spamming the history
          const isDuplicate = prev.slice(0, 3).some(a => cleanAnalysis(a.analysis) === incomingClean);

          if (isDuplicate) {
            return prev;
          }
          return [payload, ...prev].slice(0, 50);
        });
      }
    };

    const handleLedStats = (data: any) => {
      console.log("📊 LED Stats Received:", data);
      if (data?.today) setTodayLed(data.today);
      if (Array.isArray(data?.history)) setLedHistory(data.history);
      setLedHistoryLoading(false);
    };

    socket.on("ai:advice", handleAdvice);
    socket.on("led_stats", handleLedStats);

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("ai:advice", handleAdvice);
      socket.off("led_stats", handleLedStats);
    };
  }, [socket, toAiPayload]);

  const clearAlerts = useCallback(() => setAlerts([]), []);

  return (
    <AiContext.Provider value={{ 
      status, 
      alerts, 
      todayLed, 
      ledHistory, 
      ledHistoryLoading, 
      clearAlerts 
    }}>
      {children}
    </AiContext.Provider>
  );
}

export function useAiContext() {
  const context = useContext(AiContext);
  if (context === undefined) {
    throw new Error("useAiContext must be used within an AiProvider");
  }
  return context;
}
