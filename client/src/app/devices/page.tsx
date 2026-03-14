import QuickControls from '@/components/devices/QuickControls';
import LEDControl from '@/components/devices/LEDControl';
import DeviceSummary from '@/components/devices/DeviceSummary';
import IoTDeviceManager from '@/components/devices/IoTDeviceManager';

export default function DevicesPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Điều khiển thiết bị</h1>
        <p className="text-gray-600">Quản lý đèn LED và thiết bị IoT</p>
      </div>

      <QuickControls />

      <LEDControl />

      {/* Thiết bị IoT tùy chỉnh — thêm/sửa/xóa qua MQTT */}
      <IoTDeviceManager />

      <DeviceSummary />
    </div>
  );
}

