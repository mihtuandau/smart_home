"use client";

import React from "react";
import { useAiContext } from "@/contexts/AiContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { localizeAiText } from "@/lib/aiTextLocalization";
import { 
  Brain, 
  Zap, 
  Lightbulb, 
  AlertTriangle, 
  ShieldCheck, 
  Info,
  Clock
} from "lucide-react";

export default function AIInsights({ className = "" }: { className?: string }) {
  const { status, alerts } = useAiContext();
  const { t, language } = useLanguage();

  // Safety check for initial loading state
  if (!status || !status.severity) {
    return (
      <div className={`section-card border border-border rounded-xl shadow-sm flex flex-col h-full bg-card items-center justify-center p-8 ${className}`}>
        <Brain className="w-8 h-8 text-indigo-400 animate-pulse mb-3" />
        <p className="text-xs text-muted-foreground font-medium">{t("common.loading") || "Đang tải dữ liệu AI..."}</p>
      </div>
    );
  }

  const getStatusConfig = (severity: string) => {
    switch (severity) {
      case "high":
        return {
          bg: "bg-red-50 dark:bg-red-950/20",
          border: "border-red-200 dark:border-red-800",
          text: "text-red-700 dark:text-red-300",
          icon: AlertTriangle,
        };
      case "medium":
        return {
          bg: "bg-amber-50 dark:bg-amber-950/20",
          border: "border-amber-200 dark:border-amber-800",
          text: "text-amber-700 dark:text-amber-300",
          icon: Info,
        };
      default:
        return {
          bg: "bg-emerald-50 dark:bg-emerald-950/20",
          border: "border-emerald-200 dark:border-emerald-800",
          text: "text-emerald-700 dark:text-emerald-300",
          icon: ShieldCheck,
        };
    }
  };

  const config = getStatusConfig(status.severity);
  const StatusIcon = config.icon;
  const analysisLines = localizeAiText(status.analysis, language).split("|");

  const shouldShowCurrentStatus = 
    alerts.length === 0 || 
    localizeAiText(status.analysis, language).trim() !== localizeAiText(alerts[0].analysis, language).trim() ||
    status.is_critical;

  const formatPower = (w: number) => {
    if (w < 1) {
      return `${(w * 1000).toFixed(2)}mW`;
    }
    return `${w.toFixed(2)}W`;
  };

  return (
    <div className={`section-card border border-border rounded-xl shadow-sm flex flex-col h-full bg-card overflow-hidden ${className}`} style={{ minHeight: '480px' }}>
      
      {/* Synchronized Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <Brain className="w-4 h-4 text-indigo-700 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">AI Power Analytics</h2>
            <div className="flex items-center gap-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] text-emerald-600 font-medium uppercase tracking-wider">Live</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
            <Zap className="w-3 h-3" />
            <span className="text-[11px] font-bold">{formatPower(status.powerW)}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${status.led1 ? 'bg-yellow-100 text-yellow-600' : 'bg-muted text-muted-foreground'}`}>
              <Lightbulb className="w-3 h-3" />
            </div>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${status.led2 ? 'bg-yellow-100 text-yellow-600' : 'bg-muted text-muted-foreground'}`}>
              <Lightbulb className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {/* Current Status */}
        {shouldShowCurrentStatus && (
          <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-500">
            <div className={`p-4 rounded-xl border-l-4 shadow-sm ${config.bg} ${config.border}`}>
              <div className="flex items-center justify-between mb-1">
                <h4 className={`font-bold text-sm ${config.text}`}>
                  {status.is_critical ? t("ai.status.anomaly") : t("ai.status.normal")}
                </h4>
                <span className="text-[10px] font-medium text-slate-400 bg-white/50 px-1.5 py-0.5 rounded uppercase">{t("ai.now") || "NOW"}</span>
              </div>
              
              <div className="space-y-1.5 mt-2">
                {analysisLines.map((line, idx) => (
                  <p key={idx} className="text-sm text-foreground/90 leading-relaxed font-medium">
                    {line.trim()}
                  </p>
                ))}
              </div>

              {status.tips && status.tips.length > 0 && (
                <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">{t("ai.tips") || "AI Tips"}:</p>
                  <ul className="space-y-1.5">
                    {status.tips.map((tip, idx) => (
                      <li key={idx} className="flex gap-2 text-xs text-muted-foreground leading-relaxed">
                        <span className="text-indigo-500 font-bold">•</span>
                        {localizeAiText(tip, language)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* History Header */}
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t("ai.history") || "History"}</span>
          <div className="h-px flex-1 bg-border/50"></div>
        </div>

        {/* History List */}
        <div className="space-y-4">
          {alerts.length > 0 ? (
            alerts.map((alert, index) => {
              const alertConfig = getStatusConfig(alert.severity);
              const lines = localizeAiText(alert.analysis, language).split("|");

              return (
                <div
                  key={`${alert.time}-${index}`}
                  className="relative pl-4 border-l border-border hover:border-indigo-400 transition-colors py-0.5"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-medium text-muted-foreground tabular-nums">
                      {new Date(alert.time).toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${alertConfig.bg} ${alertConfig.text}`}>
                      {alert.is_critical ? t("ai.status.anomaly") : t("ai.status.normal")}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    {lines.map((line, lIdx) => (
                      <p key={lIdx} className="text-xs text-foreground/70 leading-snug">{line.trim()}</p>
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-10 flex flex-col items-center justify-center text-muted-foreground/30">
              <Brain className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-[11px] font-medium">{t("ai.noHistory") || "No history"}</p>
            </div>
          )}
        </div>
      </div>

      {/* Synchronized Footer */}
      <div className="px-4 py-2 border-t border-border flex items-center justify-center bg-card">
        <p className="text-[10px] text-muted-foreground font-medium text-center italic">
          {t("ai.footer") || "AI model updates periodically based on your usage patterns."}
        </p>
      </div>
    </div>
  );
}
