import QuickControls from '@/components/devices/QuickControls';
import LEDControl from '@/components/devices/LEDControl';
import TouchSensors from '@/components/devices/TouchSensors';
import DeviceSummary from '@/components/devices/DeviceSummary';

export default function DevicesPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Điều khiển thiết bị</h1>
        <p className="text-gray-600">Quản lý đèn LED và cảm biến chạm</p>
      </div>

      <QuickControls />

      <LEDControl />

      <TouchSensors />

      <DeviceSummary />
    </div>
  );
}
