"use client";

import { useState } from "react";
import { useControlSingleLED, useControlServo } from "@/hooks/useDevices";
import { useQueryClient } from "@tanstack/react-query";
import Toast from "@/components/ui/Toast";

interface ToastState {
  message: string;
  type: "success" | "error" | "info";
}

export default function QuickControls() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const queryClient = useQueryClient();
  const controlLED = useControlSingleLED();
  const controlServo = useControlServo();

  const handleAllLedsOn = async () => {
    try {
      queryClient.setQueryData(["devices", "latestData"], (oldData: any) => {
        if (!oldData) return oldData;
        const updated = { ...oldData };
        const dataObj = updated.data || updated;
        dataObj.led1 = true;
        dataObj.led2 = true;
        return updated;
      });

      setToast({ message: "Đã bật tất cả đèn LED", type: "success" });

      Promise.all([
        controlLED.mutateAsync({ ledNumber: 1, state: true }),
        controlLED.mutateAsync({ ledNumber: 2, state: true }),
      ]).catch((error) => {
        setToast({ message: "Không thể bật LED", type: "error" });
      });
    } catch (error) {
      setToast({ message: "Không thể bật LED", type: "error" });
    }
  };

  const handleAllLedsOff = async () => {
    try {
      queryClient.setQueryData(["devices", "latestData"], (oldData: any) => {
        if (!oldData) return oldData;
        const updated = { ...oldData };
        const dataObj = updated.data || updated;
        dataObj.led1 = false;
        dataObj.led2 = false;
        return updated;
      });

      setToast({ message: "Đã tắt tất cả đèn LED", type: "success" });

      Promise.all([
        controlLED.mutateAsync({ ledNumber: 1, state: false }),
        controlLED.mutateAsync({ ledNumber: 2, state: false }),
      ]).catch((error) => {
        setToast({ message: "Không thể tắt LED", type: "error" });
      });
    } catch (error) {
      setToast({ message: "Không thể tắt LED", type: "error" });
    }
  };

  const handleAutoMode = async () => {
    try {
      await controlServo.mutateAsync(180);
      setToast({ message: "Đã bật chế độ tự động", type: "success" });
    } catch (error) {
      setToast({ message: "Không thể điều khiển mái che", type: "error" });
    }
  };

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="section-card shadow-sm border border-gray-200 p-4 sm:p-5 md:p-6">
        <div className="mb-4">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900">
            Điều khiển nhanh
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={handleAllLedsOn}
            disabled={controlLED.isPending}
            className="w-full px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            {controlLED.isPending ? "Đang xử lý..." : "Bật tất cả đèn"}
          </button>

          <button
            onClick={handleAllLedsOff}
            disabled={controlLED.isPending}
            className="w-full px-4 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 2v10m6.364-6.364a9 9 0 11-12.728 0"
              />
            </svg>
            {controlLED.isPending ? "Đang xử lý..." : "Tắt tất cả đèn"}
          </button>

          <button
            onClick={handleAutoMode}
            disabled={controlServo.isPending}
            className="w-full px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {controlServo.isPending ? "Đang xử lý..." : "Chế độ Tự động"}
          </button>
        </div>
      </div>
    </>
  );
}
