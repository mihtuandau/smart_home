'use client';

import { useState, useEffect, useRef } from 'react';
import { useLatestDeviceData, useControlSingleLED } from '@/hooks/useDevices';
import Toast from '@/components/ui/Toast';
import { Power } from 'lucide-react';

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
}

// How long (ms) to ignore polling updates after a toggle to avoid UI flash
const TOGGLE_COOLDOWN = 10000;

export default function LEDControl() {
  const controlLEDMutation = useControlSingleLED();
  const [toast, setToast] = useState<ToastState | null>(null);
  const [localLEDs, setLocalLEDs] = useState({ led1: false, led2: false });

  // Tracks the timestamp of the last user toggle action
  const lastToggleRef = useRef<number>(0);
  // Whether localLEDs has been initialized from server data at least once
  const initializedRef = useRef<boolean>(false);

  const { data: response, isLoading } = useLatestDeviceData(5000);
  const data = (response as any)?.data || response;

  // Sync server data → localLEDs only on first load OR after cooldown expires
  useEffect(() => {
    if (!data) return;

    const msSinceToggle = Date.now() - lastToggleRef.current;

    // Always sync on initial load; afterwards only sync if cooldown has passed
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

    // Record toggle time BEFORE any state changes so the effect guard works immediately
    lastToggleRef.current = Date.now();

    // Optimistic local update
    setLocalLEDs(prev => ({
      ...prev,
      [ledNumber === 1 ? 'led1' : 'led2']: newState,
    }));

    try {
      await controlLEDMutation.mutateAsync({ ledNumber, state: newState });
      setToast({
        message: `LED ${ledNumber} đã ${newState ? 'bật' : 'tắt'}`,
        type: 'success',
      });
    } catch (error: any) {
      console.error(`[LED${ledNumber}] Error:`, error);
      // Rollback and let polling take over immediately
      lastToggleRef.current = 0;
      setLocalLEDs(prev => ({
        ...prev,
        [ledNumber === 1 ? 'led1' : 'led2']: currentState,
      }));
      setToast({ message: 'Không thể điều khiển LED', type: 'error' });
    }
  };

  const leds = [
    { 
      id: 1, 
      name: 'LED 1', 
      description: 'Đèn LED chính', 
      enabled: localLEDs.led1
    },
    { 
      id: 2, 
      name: 'LED 2', 
      description: 'Đèn LED phụ', 
      enabled: localLEDs.led2
    },
  ];

  if (isLoading) {
    return (
      <div className="section-card shadow-sm border border-gray-200 p-4 sm:p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
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
      
      <div className="section-card shadow-sm border border-gray-200 p-4 sm:p-5 md:p-6">
      <div className="mb-4 sm:mb-6">
        <h3 className="text-sm sm:text-base font-semibold text-gray-900">Điều khiển đèn LED (x2)</h3>
      </div>
      
      <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">Hệ thống chiếu sáng trong nhà</p>
      
      <div className="space-y-4">
        {leds.map((led) => (
          <div key={led.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div
                className={`w-2 h-2 rounded-full shrink-0 ${
                  led.enabled ? 'bg-yellow-500' : 'bg-gray-400'
                }`}
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {led.name}
                </p>
                <p className="text-xs text-gray-500">
                  {led.description}
                </p>
              </div>
            </div>

            {/* Round power button – Apple Home style */}
            <button
              onClick={() => toggleLed(led.id as 1 | 2)}
              disabled={controlLEDMutation.isPending}
              title={led.enabled ? 'Nhấn để tắt' : 'Nhấn để bật'}
              className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 ml-4
                transition-all duration-200 select-none
                ${led.enabled
                  ? 'bg-yellow-400 shadow-[0_0_16px_4px_rgba(250,204,21,0.55)]'
                  : 'bg-gray-200 shadow-inner'}
                ${controlLEDMutation.isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-90 hover:brightness-105'}`}
            >
              {/* Power icon */}
              <Power className={`w-5 h-5 transition-colors duration-200 ${led.enabled ? 'text-yellow-900' : 'text-gray-400'}`} />
            </button>
          </div>
        ))}
      </div>
      </div>
    </>
  );
}
