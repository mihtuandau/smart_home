import { apiClient } from './client';

export const iotApi = {
  // ═════════════════════════════════════════════════════════════
  // 🔌 BUILT-IN DEVICES (LED, Servo) — Cố định, không có CRUD
  // ═════════════════════════════════════════════════════════════

  /**
   * Điều khiển LED1 và LED2 (built-in)
   * @param data { led1?: boolean, led2?: boolean }
   */
  async controlLED(data: { led1?: boolean; led2?: boolean }) {
    return apiClient.request('/iot/control/led', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Điều khiển một LED đơn lẻ
   * @param ledNumber 1 hoặc 2
   * @param state true = ON, false = OFF
   */
  async controlLedSingle(ledNumber: number, state: boolean) {
    const data = ledNumber === 1 ? { led1: state } : { led2: state };
    return iotApi.controlLED(data);
  },

  /**
   * Điều khiển Servo motor (0°, 90°, 180°)
   */
  async controlServo(angle: number) {
    return apiClient.request('/iot/control/servo', {
      method: 'POST',
      body: JSON.stringify({ angle }),
    });
  },

  // ═════════════════════════════════════════════════════════════
  // 📊 STATUS & DATA MONITORING
  // ═════════════════════════════════════════════════════════════

  /**
   * Lấy trạng thái kết nối MQTT
   */
  async getIoTStatus() {
    return apiClient.request('/iot/status');
  },

  /**
   * Lấy dữ liệu thiết bị mới nhất (latest data từ MQTT)
   */
  async getLatestIoTData() {
    return apiClient.request('/iot/data/latest');
  },

  /**
   * Lấy dữ liệu cảm biến (DHT, áp suất, v.v.)
   */
  async getIoTSensors() {
    return apiClient.request('/iot/sensors');
  },

  /**
   * Lấy dữ liệu điện năng (voltage, current, power)
   */
  async getIoTPower() {
    return apiClient.request('/iot/power');
  },

  /**
   * Lấy danh sách tất cả thiết bị
   */
  async getIoTDevices() {
    return apiClient.request('/iot/devices');
  },

  /**
   * Lấy nhật ký hoạt động
   */
  async getIoTLogs() {
    return apiClient.request('/iot/logs');
  },

  // ═════════════════════════════════════════════════════════════
  // ⚙️ CUSTOM IoT DEVICES (device1, device2) — User-defined CRUD
  // ═════════════════════════════════════════════════════════════

  /**
   * Thêm thiết bị IoT tùy chỉnh mới (device1 hoặc device2)
   * @param name Tên thiết bị (VD: "Quạt tầng 1")
   * @param power_consumption Công suất (W)
   */
  async addIoTDevice(name: string, power_consumption: number) {
    return apiClient.request('/iot/device/add', {
      method: 'POST',
      body: JSON.stringify({ name, power_consumption }),
    });
  },

  /**
   * Cập nhật thông tin thiết bị IoT
   * @param index 0 (device1) hoặc 1 (device2)
   * @param data { name?, power_consumption? }
   */
  async updateIoTDevice(index: number, data: { name?: string; power_consumption?: number }) {
    return apiClient.request(`/iot/device/update/${index}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Điều khiển thiết bị IoT (bật/tắt)
   * @param data { device1?: boolean, device2?: boolean }
   */
  async controlIoTDevice(data: { device1?: boolean; device2?: boolean }) {
    return apiClient.request('/iot/device/control', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Xóa thiết bị IoT
   * @param index 0 (device1) hoặc 1 (device2)
   */
  async deleteIoTDevice(index: number) {
    return apiClient.request(`/iot/device/delete/${index}`, {
      method: 'DELETE',
    });
  },
};

