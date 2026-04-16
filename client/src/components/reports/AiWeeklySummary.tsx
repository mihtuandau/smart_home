"use client";

import React, { useEffect, useState } from "react";
import { Bot, Sparkles, Loader2, Zap, AlertTriangle } from "lucide-react";

export default function AiWeeklySummary() {
  const [summaryData, setSummaryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:3100/ai/weekly-summary");
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();
        setSummaryData(data);
      } catch (err) {
        console.error("Failed to fetch AI summary:", err);
        setError("Không thể tải báo cáo AI từ Mina lúc này.");
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-8 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 animate-pulse">
          Mina đang phân tích biểu đồ điện...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 backdrop-blur-md rounded-2xl p-6 border border-red-100 dark:border-red-800/30 shadow-sm flex items-center space-x-3">
        <AlertTriangle className="text-red-500 w-6 h-6" />
        <p className="text-sm text-red-600 dark:text-red-400 font-medium">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 dark:from-indigo-950/40 dark:via-purple-900/10 dark:to-gray-900 rounded-3xl p-1 border border-indigo-100 hover:border-indigo-300 dark:border-indigo-500/20 transition-all duration-500 shadow-lg group">
      <div className="absolute -top-10 -right-10 p-4 opacity-10 group-hover:scale-110 transition-transform duration-700 ease-out pointer-events-none">
        <Bot className="w-48 h-48 text-indigo-600" />
      </div>

      <div className="relative bg-white/60 dark:bg-gray-900/60 backdrop-blur-2xl rounded-[1.4rem] p-6 sm:p-8">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Sparkles className="w-7 h-7 text-white animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 tracking-tight">
              Góc nhìn của Mina
            </h2>
            <p className="text-sm font-medium text-indigo-600/70 dark:text-indigo-400/70">
              Báo cáo tuần bằng AI
            </p>
          </div>
        </div>

        <div className="bg-white/50 dark:bg-gray-800/50 p-5 rounded-2xl mb-8 border border-white dark:border-gray-700 shadow-sm relative">
          <span className="text-5xl text-indigo-200 dark:text-indigo-600/50 absolute -top-4 -left-2 tracking-tighter">
            "
          </span>
          <p className="text-gray-700 dark:text-gray-200 leading-relaxed text-base font-medium relative z-10 pl-4 py-2 border-l-4 border-indigo-400">
            {summaryData?.summary}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-indigo-100/50 dark:border-gray-700/50 pt-6">
          <div className="bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 transition-colors rounded-2xl p-4 flex flex-col items-center justify-center space-y-2 border border-white dark:border-gray-700 shadow-sm text-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full">
              <Zap className="w-5 h-5" />
            </div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">
              Điện Chiếu Sáng
            </p>
            <p className="text-xl font-black text-gray-800 dark:text-gray-100">
              {summaryData?.data?.kwhTotal}{" "}
              <span className="text-xs font-semibold text-gray-500">kWh</span>
            </p>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 transition-colors rounded-2xl p-4 flex flex-col items-center justify-center space-y-2 border border-white dark:border-gray-700 shadow-sm text-center">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 rounded-full">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">
              Vượt Tải Bất Thường
            </p>
            <p className="text-xl font-black text-gray-800 dark:text-gray-100">
              {summaryData?.data?.highPeakCount}{" "}
              <span className="text-xs font-semibold text-gray-500">lần</span>
            </p>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 transition-colors rounded-2xl p-4 flex flex-col items-center justify-center space-y-2 border border-white dark:border-gray-700 shadow-sm text-center">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 rounded-full">
              <Bot className="w-5 h-5" />
            </div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">
              Quên Tắt Đèn
            </p>
            <p className="text-xl font-black text-gray-800 dark:text-gray-100">
              {summaryData?.data?.ledForgotCount}{" "}
              <span className="text-xs font-semibold text-gray-500">lần</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
