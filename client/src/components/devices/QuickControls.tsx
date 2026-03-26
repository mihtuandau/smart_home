"use client";

import { useState } from "react";
import { useControlSingleLED } from "@/hooks/useDevices";
import { useQueryClient } from "@tanstack/react-query";
import Toast from "@/components/ui/Toast";
import { Lightbulb, Power } from 'lucide-react';

interface ToastState {
  message: string;
  type: "success" | "error" | "info";
}

export default function QuickControls() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const queryClient = useQueryClient();
  const controlLED = useControlSingleLED();

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



  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="section-card shadow-sm border border-border p-4 sm:p-5 md:p-6">
        <div className="mb-6 text-center">
          <h3 className="text-sm sm:text-base font-semibold text-foreground">
            Điều khiển nhanh
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Bật/tắt toàn bộ đèn LED một cách nhanh chóng
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleAllLedsOn}
            disabled={controlLED.isPending}
            className="w-full px-4 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Lightbulb className="w-4 h-4" />
            {controlLED.isPending ? "Đang xử lý..." : "Bật đèn"}
          </button>

          <button
            onClick={handleAllLedsOff}
            disabled={controlLED.isPending}
            className="w-full px-4 py-4 bg-card text-foreground border border-border rounded-lg hover:bg-muted transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Power className="w-4 h-4" />
            {controlLED.isPending ? "Đang xử lý..." : "Tắt đèn"}
          </button>
        </div>
      </div>
    </>
  );
}
