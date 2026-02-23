'use client';

import { useState, useEffect, useRef } from 'react';
import { useLatestDeviceData, useControlSingleLED } from '@/hooks/useDevices';
import Toast from '@/components/ui/Toast';

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
      <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
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
      
      <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <h3 className="font-semibold text-gray-900">Điều khiển đèn LED (x2)</h3>
      </div>
      
      <p className="text-sm text-gray-500 mb-6">Hệ thống chiếu sáng trong nhà</p>
      
      <div className="space-y-4">
        {leds.map((led) => (
          <div key={led.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                led.enabled ? 'bg-yellow-100' : 'bg-gray-200'
              }`}>
                <svg className={`w-5 h-5 ${led.enabled ? 'text-yellow-600' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">{led.name}</p>
                <p className="text-sm text-gray-500">{led.description}</p>
                <p className={`text-xs font-medium mt-1 ${
                  led.enabled ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {controlLEDMutation.isPending ? '⏳ Đang xử lý...' : (led.enabled ? '● Đang bật' : '○ Đã tắt')}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => toggleLed(led.id as 1 | 2)}
              disabled={controlLEDMutation.isPending}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                led.enabled ? 'bg-blue-600' : 'bg-gray-300'
              } ${controlLEDMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  led.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
      </div>
    </>
  );
}
