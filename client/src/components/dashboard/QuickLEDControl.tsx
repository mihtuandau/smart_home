'use client';

import { useState, useEffect, useRef } from 'react';
import { useLatestDeviceData, useControlSingleLED } from '@/hooks/useDevices';
import Toast from '@/components/ui/Toast';

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
}

const TOGGLE_COOLDOWN = 10000;

export default function QuickLEDControl() {
  const controlLEDMutation = useControlSingleLED();
  const [toast, setToast] = useState<ToastState | null>(null);
  const [localLEDs, setLocalLEDs] = useState({ led1: false, led2: false });
  
  const lastToggleRef = useRef<number>(0);
  const initializedRef = useRef<boolean>(false);

  const { data: response, isLoading } = useLatestDeviceData(2000); // Reduced from 5000ms to 2000ms
  const data = (response as any)?.data || response;

  useEffect(() => {
    if (!data) return;
    const msSinceToggle = Date.now() - lastToggleRef.current;
    if (!initializedRef.current || msSinceToggle >= TOGGLE_COOLDOWN) {
      initializedRef.current = true;
      setLocalLEDs(prev => {
        const next = { led1: data.led1 === true, led2: data.led2 === true };
        if (prev.led1 !== next.led1 || prev.led2 !== next.led2) return next;
        return prev;
      });
    }
  }, [data]);

  const toggleLed = async (ledNumber: 1 | 2) => {
    if (controlLEDMutation.isPending) return;
    
    const newState = ledNumber === 1 ? !localLEDs.led1 : !localLEDs.led2;
    setLocalLEDs(prev => ({ ...prev, [ledNumber === 1 ? 'led1' : 'led2']: newState }));
    lastToggleRef.current = Date.now();

    try {
      await controlLEDMutation.mutateAsync({ ledNumber, state: newState });
      setToast({
        message: `Đèn ${ledNumber} đã ${newState ? 'bật' : 'tắt'}`,
        type: 'success'
      });
    } catch (error) {
      setLocalLEDs(prev => ({ ...prev, [ledNumber === 1 ? 'led1' : 'led2']: !newState }));
      setToast({
        message: `Không thể điều khiển đèn ${ledNumber}`,
        type: 'error'
      });
    }
  };

  if (isLoading) {
    return <div className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse h-32" />;
  }

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-3">🔆 Bật/Tắt Đèn LED</h3>
        
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => toggleLed(1)}
            disabled={controlLEDMutation.isPending}
            className={`p-3 rounded-lg font-medium text-sm transition-all ${
              localLEDs.led1
                ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-400'
                : 'bg-gray-100 text-gray-600 border-2 border-gray-300'
            } hover:shadow-sm disabled:opacity-50`}
          >
            <div className="text-lg mb-1">{localLEDs.led1 ? '💡' : '🔦'}</div>
            <div>Đèn 1</div>
            <div className="text-xs mt-1">{localLEDs.led1 ? 'BẬT' : 'TẮT'}</div>
          </button>
          
          <button
            onClick={() => toggleLed(2)}
            disabled={controlLEDMutation.isPending}
            className={`p-3 rounded-lg font-medium text-sm transition-all ${
              localLEDs.led2
                ? 'bg-blue-100 text-blue-800 border-2 border-blue-400'
                : 'bg-gray-100 text-gray-600 border-2 border-gray-300'
            } hover:shadow-sm disabled:opacity-50`}
          >
            <div className="text-lg mb-1">{localLEDs.led2 ? '💡' : '🔦'}</div>
            <div>Đèn 2</div>
            <div className="text-xs mt-1">{localLEDs.led2 ? 'BẬT' : 'TẮT'}</div>
          </button>
        </div>
        
        <p className="text-xs text-gray-500 mt-3 text-center">Trạng thái: {localLEDs.led1 || localLEDs.led2 ? `${localLEDs.led1 ? '1' : ''}${localLEDs.led1 && localLEDs.led2 ? ',' : ''}${localLEDs.led2 ? '2' : ''}` : 'Tất cả tắt'}</p>
      </div>
    </>
  );
}
