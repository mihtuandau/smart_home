import QuickControls from '@/components/devices/QuickControls';
import LEDControl from '@/components/devices/LEDControl';
import DeviceSummary from '@/components/devices/DeviceSummary';
import IoTDeviceManager from '@/components/devices/IoTDeviceManager';

export default function DevicesPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-1">
        <h1 className="page-title">Điều khiển thiết bị</h1>
        <p className="page-subtitle">Quản lý đèn LED và thiết bị IoT</p>
      </div>

      <QuickControls />

      <LEDControl />

      {/* Thiết bị IoT tùy chỉnh — thêm/sửa/xóa qua MQTT */}
      <IoTDeviceManager />

      <DeviceSummary />
    </div>
  );
}

