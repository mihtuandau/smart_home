'use client';

import { useState, useEffect, useRef } from 'react';
import { useLatestDeviceData, useControlSingleLED } from '@/hooks/useDevices';
import { useLanguage } from '@/contexts/LanguageContext';
import Toast from '@/components/ui/Toast';
import { Power } from 'lucide-react';

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
}

const TOGGLE_COOLDOWN = 10000;

export default function LEDControl() {
  const controlLEDMutation = useControlSingleLED();
  const { t } = useLanguage();
  const [toast, setToast] = useState<ToastState | null>(null);
  const [localLEDs, setLocalLEDs] = useState({ led1: false, led2: false });

  const lastToggleRef = useRef<number>(0);
  const initializedRef = useRef<boolean>(false);

  const { data: response, isLoading } = useLatestDeviceData(5000);
  const data = (response as any)?.data || response;

  useEffect(() => {
    if (!data) return;

    const msSinceToggle = Date.now() - lastToggleRef.current;

    if (!initializedRef.current || msSinceToggle >= TOGGLE_COOLDOWN) {
      initializedRef.current = true;
      setLocalLEDs(prev => {
        const next = {
          led1: data.led1 === true,
          led2: data.led2 === true,
        };
        if (prev.led1 !== next.led1 || prev.led2 !== next.led2) return next;
        return prev;
      });
    }
  }, [data]);

  const toggleLed = async (ledNumber: 1 | 2) => {
    if (controlLEDMutation.isPending) return;

    const currentState = ledNumber === 1 ? localLEDs.led1 : localLEDs.led2;
    const newState = !currentState;

    lastToggleRef.current = Date.now();

    setLocalLEDs(prev => ({
      ...prev,
      [ledNumber === 1 ? 'led1' : 'led2']: newState,
    }));

    try {
      await controlLEDMutation.mutateAsync({ ledNumber, state: newState });
      setToast({
        message: `${t(`devices.led${ledNumber}`)} ${newState ? t('devices.on').toLowerCase() : t('devices.off').toLowerCase()}`,
        type: 'success',
      });
    } catch {
      lastToggleRef.current = 0;
      setLocalLEDs(prev => ({
        ...prev,
        [ledNumber === 1 ? 'led1' : 'led2']: currentState,
      }));
      setToast({ message: t('devices.error'), type: 'error' });
    }
  };

  const leds = [
    {
      id: 1,
      name: t('devices.led1'),
      description: t('devices.led1Description'),
      enabled: localLEDs.led1
    },
    {
      id: 2,
      name: t('devices.led2'),
      description: t('devices.led2Description'),
      enabled: localLEDs.led2
    },
  ];

  if (isLoading) {
    return (
      <div className="section-card shadow-sm border border-border p-4 sm:p-6 animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3 mb-6"></div>
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="h-20 bg-muted rounded"></div>
          ))}
        </div>
      </div>
    );
  }

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
      <div className="mb-4 sm:mb-6">
        <h3 className="text-sm sm:text-base font-semibold text-foreground">{t('devices.ledControl')} (x2)</h3>
      </div>

      <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">{t('devices.lightingSystem')}</p>

      <div className="space-y-4">
        {leds.map((led) => (
          <div key={led.id} className="flex items-center justify-between p-3 bg-muted rounded-md hover:bg-accent transition-colors">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div
                className={`w-2 h-2 rounded-full shrink-0 ${
                  led.enabled ? 'bg-yellow-500' : 'bg-gray-400'
                }`}
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {led.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {led.description}
                </p>
              </div>
            </div>

            <button
              onClick={() => toggleLed(led.id as 1 | 2)}
              disabled={controlLEDMutation.isPending}
              title={led.enabled ? t('devices.clickToOff') : t('devices.clickToOn')}
              className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 ml-4
                transition-all duration-200 select-none
                ${led.enabled
                  ? 'bg-yellow-400 shadow-[0_0_16px_4px_rgba(250,204,21,0.55)]'
                  : 'bg-muted shadow-inner'}
                ${controlLEDMutation.isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-90 hover:brightness-105'}`}
            >

              <Power className={`w-5 h-5 transition-colors duration-200 ${led.enabled ? 'text-yellow-900' : 'text-gray-400'}`} />
            </button>
          </div>
        ))}
      </div>
      </div>
    </>
  );
}
