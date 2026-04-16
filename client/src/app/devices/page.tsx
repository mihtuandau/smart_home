'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import QuickControls from '@/components/devices/QuickControls';
import LEDControl from '@/components/devices/LEDControl';
// import DeviceSummary from '@/components/devices/DeviceSummary';
import IoTDeviceManager from '@/components/devices/IoTDeviceManager';

export default function DevicesPage() {
  const { t } = useLanguage();

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-1">
        <h1 className="page-title">{t('devices.title')}</h1>
        <p className="page-subtitle">{t('devices.subtitle')}</p>
      </div>

      <QuickControls />

      <LEDControl />

      <IoTDeviceManager />

      {/* <DeviceSummary /> */}
    </div>
  );
}
