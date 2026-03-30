"use client";

import { useState } from "react";
import { useControlSingleLED } from "@/hooks/devices";
import { useQueryClient } from "@tanstack/react-query";
import { useLanguage } from '@/contexts/LanguageContext';
import Toast from "@/components/ui/Toast";
import { Lightbulb, Power } from 'lucide-react';

interface ToastState {
  message: string;
  type: "success" | "error" | "info";
}

type LooseRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is LooseRecord =>
  typeof value === 'object' && value !== null;

const patchLedState = (oldData: unknown, led1: boolean, led2: boolean) => {
  if (!isRecord(oldData)) return oldData;

  const updated = { ...oldData };
  const dataObj = isRecord(updated.data) ? { ...updated.data } : { ...updated };
  dataObj.led1 = led1;
  dataObj.led2 = led2;

  return {
    ...updated,
    data: dataObj,
  };
};

export default function QuickControls() {
  const { t } = useLanguage();
  const [toast, setToast] = useState<ToastState | null>(null);
  const queryClient = useQueryClient();
  const controlLED = useControlSingleLED();

  const handleAllLedsOn = async () => {
    try {
      queryClient.setQueryData(["devices", "latestData"], (oldData: unknown) =>
        patchLedState(oldData, true, true)
      );

      setToast({ message: t('devices.allOnSuccess'), type: "success" });

      Promise.all([
        controlLED.mutateAsync({ ledNumber: 1, state: true }),
        controlLED.mutateAsync({ ledNumber: 2, state: true }),
      ]).catch(() => {
        setToast({ message: t('devices.allOnError'), type: "error" });
      });
    } catch {
      setToast({ message: t('devices.allOnError'), type: "error" });
    }
  };

  const handleAllLedsOff = async () => {
    try {
      queryClient.setQueryData(["devices", "latestData"], (oldData: unknown) =>
        patchLedState(oldData, false, false)
      );

      setToast({ message: t('devices.allOffSuccess'), type: "success" });

      Promise.all([
        controlLED.mutateAsync({ ledNumber: 1, state: false }),
        controlLED.mutateAsync({ ledNumber: 2, state: false }),
      ]).catch(() => {
        setToast({ message: t('devices.allOffError'), type: "error" });
      });
    } catch {
      setToast({ message: t('devices.allOffError'), type: "error" });
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
            {t('devices.quickControl')}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {t('devices.quickControlSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleAllLedsOn}
            disabled={controlLED.isPending}
            className="w-full px-4 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Lightbulb className="w-4 h-4" />
            {controlLED.isPending ? t('devices.processing') : t('devices.turnOnLights')}
          </button>

          <button
            onClick={handleAllLedsOff}
            disabled={controlLED.isPending}
            className="w-full px-4 py-4 bg-card text-foreground border border-border rounded-lg hover:bg-muted transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Power className="w-4 h-4" />
            {controlLED.isPending ? t('devices.processing') : t('devices.turnOffLights')}
          </button>
        </div>
      </div>
    </>
  );
}
