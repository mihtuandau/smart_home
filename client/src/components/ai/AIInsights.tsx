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
  Clock,
  History
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
  const analysisLines = localizeAiText(status.analysis, language).split("|");

  const shouldShowCurrentStatus = 
    alerts.length === 0 || 
    localizeAiText(status.analysis, language).trim() !== localizeAiText(alerts[0].analysis, language).trim() ||
    status.is_critical;

  const formatPower = (w: number) => {
    if (w < 1) {
      return `${(w * 1000).toFixed(1)} mW`;
    }
    return `${w.toFixed(2)} W`;
  };

  return (
    <div className={`section-card border border-border rounded-xl shadow-sm flex flex-col h-full bg-card overflow-hidden ${className}`} style={{ minHeight: '580px', maxHeight: '580px' }}>
      
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-white dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shadow-sm">
            <Brain className="w-4 h-4 text-indigo-700 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground tracking-tight">AI Power Analytics</h2>
            <div className="flex items-center gap-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest">Live System</span>
            </div>
          </div>
        </div>
      </div>

      {/* Unified Energy Monitor Center */}
      <div className="mx-4 mt-4 mb-2 p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/40 dark:to-slate-900/20 border border-slate-200/60 dark:border-slate-800/60 shadow-sm shrink-0">
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Công suất hiện tại</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`text-3xl font-black tabular-nums tracking-tighter ${
                (status?.powerW ?? 0) > 1500 ? 'text-red-600' : 
                (status?.powerW ?? 0) > 500 ? 'text-amber-600' : 'text-emerald-600'
              }`}>
                {formatPower(status?.powerW ?? 0).split(' ')[0]}
              </span>
              <span className="text-sm font-bold text-slate-400 uppercase">{formatPower(status?.powerW ?? 0).split(' ')[1]}</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-1.5">
              <div className={`px-2.5 py-1 rounded-full flex items-center gap-1.5 border transition-all duration-300 ${
                status.led1 ? 'bg-yellow-100/80 border-yellow-200 text-yellow-700 shadow-sm' : 'bg-slate-100/50 border-slate-200 text-slate-400'
              }`}>
                <Lightbulb className={`w-3 h-3 ${status.led1 ? 'fill-yellow-500' : ''}`} />
                <span className="text-[9px] font-bold">P.Khách</span>
              </div>
              <div className={`px-2.5 py-1 rounded-full flex items-center gap-1.5 border transition-all duration-300 ${
                status.led2 ? 'bg-blue-100/80 border-blue-200 text-blue-700 shadow-sm' : 'bg-slate-100/50 border-slate-200 text-slate-400'
              }`}>
                <Lightbulb className={`w-3 h-3 ${status.led2 ? 'fill-blue-500' : ''}`} />
                <span className="text-[9px] font-bold">B.Công</span>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
              (status?.powerW ?? 0) > 1500 ? 'bg-red-100 text-red-700' : 
              (status?.powerW ?? 0) > 500 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
            }`}>
              {(status?.powerW ?? 0) > 1500 ? 'TẢI RẤT CAO' : 
               (status?.powerW ?? 0) > 500 ? 'TẢI TRUNG BÌNH' : 'BÌNH THƯỜNG'}
            </span>
          </div>
        </div>

        {/* Dynamic Power Pipe */}
        <div className="space-y-2">
          <div className="relative h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner border border-white/10">
            <div 
              className="absolute top-0 left-0 h-full transition-all duration-1000 ease-out rounded-full"
              style={{ 
                width: (() => {
                  const p = status?.powerW ?? 0;
                  if (p <= 0) return '0%';
                  if (p <= 100) return `${(p / 100) * 25}%`; // 0-100W chiếm 25% (Rất nhạy)
                  if (p <= 500) return `${25 + ((p - 100) / 400) * 20}%`; // 100-500W thêm 20%
                  if (p <= 1500) return `${45 + ((p - 500) / 1000) * 30}%`; // 500-1500W thêm 30%
                  return `${75 + Math.min(((p - 1500) / 1500) * 25, 25)}%`;
                })(),
                background: (status?.powerW ?? 0) > 1500 
                  ? 'linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)' 
                  : (status?.powerW ?? 0) > 500 
                    ? 'linear-gradient(90deg, #10b981 0%, #f59e0b 100%)'
                    : 'linear-gradient(90deg, #34d399 0%, #10b981 100%)',
                boxShadow: '0 0 10px rgba(0,0,0,0.1) inset'
              }}
            />
          </div>
          <div className="flex justify-between px-0.5">
            <span className="text-[9px] font-bold text-slate-400 tracking-tighter">0W</span>
            <span className="text-[9px] font-bold text-slate-400 tracking-tighter">500W</span>
            <span className="text-[9px] font-bold text-slate-400 tracking-tighter">1500W</span>
            <span className="text-[9px] font-bold text-slate-400 tracking-tighter">3000W+</span>
          </div>
        </div>
      </div>

      {/* Scrollable History Section */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="px-4 py-2 bg-slate-50/80 dark:bg-slate-900/40 border-y border-border/50 sticky top-0 z-10 backdrop-blur-sm flex items-center justify-between">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <History className="w-3 h-3" />
            {t("ai.history") || "Lịch sử phân tích"}
          </h3>
          <span className="text-[9px] font-medium text-slate-400 italic">Live Update</span>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-white/30 dark:bg-black/10">
          <div className="space-y-6">
            {/* Current Status Item */}
            {shouldShowCurrentStatus && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-500">
                <div className={`p-4 rounded-xl border-l-4 shadow-sm ${config.bg} ${config.border} bg-white dark:bg-slate-900`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={`font-bold text-sm ${config.text}`}>
                      {status.is_critical ? t("ai.status.anomaly") : t("ai.status.normal")}
                    </h4>
                    <span className="text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-black/20 px-1.5 py-0.5 rounded uppercase">{t("ai.now") || "NOW"}</span>
                  </div>
                  
                  <div className="space-y-1.5">
                    {analysisLines.map((line, idx) => (
                      <p key={idx} className="text-sm text-foreground/90 leading-relaxed font-medium">
                        {line.trim()}
                      </p>
                    ))}
                  </div>

                  {status.tips && status.tips.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">{t("ai.tips") || "Lời khuyên AI"}:</p>
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

            {/* Historical Alerts List */}
            <div className="space-y-4 pb-4">
              {alerts.length > 0 ? (
                alerts.map((alert, index) => {
                  const alertConfig = getStatusConfig(alert.severity);
                  const lines = localizeAiText(alert.analysis, language).split("|");
                  return (
                    <div key={`${alert.time}-${index}`} className="group relative pl-4 border-l border-slate-200 dark:border-slate-800 hover:border-indigo-400 transition-colors py-1">
                      <div className="absolute left-[-4.5px] top-2.5 w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700 group-hover:bg-indigo-400 transition-colors shadow-sm"></div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-slate-400 tabular-nums">
                          {new Date(alert.time).toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span className={`px-1.5 py-0.25 rounded text-[9px] font-bold uppercase ${alertConfig.bg} ${alertConfig.text} bg-slate-100 dark:bg-slate-800`}>
                          {alert.is_critical ? "Bất thường" : "Ổn định"}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {lines.map((line, lIdx) => (
                          <p key={lIdx} className="text-[11px] text-muted-foreground leading-tight">
                            {line.trim()}
                          </p>
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-muted-foreground/30 opacity-50">
                  <Brain className="w-8 h-8 mb-2" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">{t("ai.noHistory") || "Chưa có dữ liệu lịch sử"}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-border flex items-center justify-center bg-white dark:bg-slate-900 shrink-0">
        <p className="text-[9px] text-muted-foreground font-medium text-center italic">
          {t("ai.footer") || "AI model tự động cập nhật dựa trên thói quen của bạn."}
        </p>
      </div>
    </div>
  );
}
