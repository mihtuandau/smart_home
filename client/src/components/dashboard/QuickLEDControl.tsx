'use client';

import { useEffect, useRef, useState } from 'react';
import { useLatestDeviceData, useControlSingleLED } from '@/hooks/devices';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRequireAuthAction } from '@/hooks/useRequireAuthAction';
import Toast from '@/components/ui/Toast';
import { Flashlight, Lightbulb, Sun } from 'lucide-react';

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
}

interface LedDataShape {
  led1?: boolean;
  led2?: boolean;
}

interface LedResponseShape extends LedDataShape {
  data?: LedDataShape;
}

const TOGGLE_COOLDOWN = 10000;

export default function QuickLEDControl() {
  const controlLEDMutation = useControlSingleLED();
  const { t } = useLanguage();
  const { requireAuth } = useRequireAuthAction();
  const [toast, setToast] = useState<ToastState | null>(null);
  const [optimisticLEDs, setOptimisticLEDs] = useState<LedDataShape | null>(null);
  const [cooldownActive, setCooldownActive] = useState(false);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: response, isLoading } = useLatestDeviceData(2000);
  const raw = (response as LedResponseShape | undefined)?.data ?? (response as LedResponseShape | undefined);
  const serverLEDs: LedDataShape = {
    led1: raw?.led1 === true,
    led2: raw?.led2 === true,
  };
  const localLEDs: LedDataShape = cooldownActive && optimisticLEDs ? optimisticLEDs : serverLEDs;

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
      }
    };
  }, []);

  const startCooldown = () => {
    setCooldownActive(true);
    if (cooldownTimerRef.current) {
      clearTimeout(cooldownTimerRef.current);
    }
    cooldownTimerRef.current = setTimeout(() => {
      setCooldownActive(false);
      setOptimisticLEDs(null);
    }, TOGGLE_COOLDOWN);
  };

  const toggleLed = async (ledNumber: 1 | 2) => {
    if (controlLEDMutation.isPending) return;
    if (!requireAuth()) {
      setToast({ message: t('auth.loginRequiredAction'), type: 'info' });
      return;
    }

    const key = ledNumber === 1 ? 'led1' : 'led2';
    const newState = !(localLEDs[key] === true);
    const nextLocal = { ...localLEDs, [key]: newState };

    setOptimisticLEDs(nextLocal);
    startCooldown();

    try {
      await controlLEDMutation.mutateAsync({ ledNumber, state: newState });
      setToast({
        message: `${t(`devices.led${ledNumber}`)} ${newState ? t('devices.on').toLowerCase() : t('devices.off').toLowerCase()}`,
        type: 'success'
      });
    } catch {
      setOptimisticLEDs({ ...nextLocal, [key]: !newState });
      setToast({
        message: t('devices.error'),
        type: 'error'
      });
    }
  };

  if (isLoading) {
    return <div className="bg-card rounded-lg border border-border p-4 animate-pulse h-32" />;
  }

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="section-card shadow-sm border border-border p-4 sm:p-5">
        <h3 className="text-sm sm:text-base font-semibold text-foreground mb-3 inline-flex items-center gap-2"><Sun className="w-4 h-4" />{t('dashboard.quickLedControl')}</h3>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => toggleLed(1)}
            disabled={controlLEDMutation.isPending}
            className={`p-3.5 sm:p-3 rounded-lg font-medium text-xs sm:text-sm transition-all ${
              localLEDs.led1
                ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-400'
                : 'bg-muted text-muted-foreground border-2 border-border'
            } hover:shadow-sm disabled:opacity-50`}
          >
            <div className="text-lg mb-1 inline-flex items-center justify-center">{localLEDs.led1 ? <Lightbulb className="w-5 h-5" /> : <Flashlight className="w-5 h-5" />}</div>
            <div>{t('devices.led1')}</div>
            <div className="text-[11px] sm:text-xs mt-1">{localLEDs.led1 ? t('devices.on').toUpperCase() : t('devices.off').toUpperCase()}</div>
          </button>

          <button
            onClick={() => toggleLed(2)}
            disabled={controlLEDMutation.isPending}
            className={`p-3.5 sm:p-3 rounded-lg font-medium text-xs sm:text-sm transition-all ${
              localLEDs.led2
                ? 'bg-blue-100 text-blue-800 border-2 border-blue-400'
                : 'bg-muted text-muted-foreground border-2 border-border'
            } hover:shadow-sm disabled:opacity-50`}
          >
            <div className="text-lg mb-1 inline-flex items-center justify-center">{localLEDs.led2 ? <Lightbulb className="w-5 h-5" /> : <Flashlight className="w-5 h-5" />}</div>
            <div>{t('devices.led2')}</div>
            <div className="text-[11px] sm:text-xs mt-1">{localLEDs.led2 ? t('devices.on').toUpperCase() : t('devices.off').toUpperCase()}</div>
          </button>
        </div>

        <p className="text-[11px] sm:text-xs text-muted-foreground mt-3 text-center">{t('devices.status')}: {localLEDs.led1 || localLEDs.led2 ? `${localLEDs.led1 ? '1' : ''}${localLEDs.led1 && localLEDs.led2 ? ',' : ''}${localLEDs.led2 ? '2' : ''}` : t('devices.allOff')}</p>
      </div>
    </>
  );
}
