/**
 * IoT Device Manager Constants & Types
 */

import type { CustomIoTDevice } from '@/hooks/useIoTForms';

export interface LatestDeviceData {
  device1?: CustomIoTDevice;
  device2?: CustomIoTDevice;
  [key: string]: unknown;
}

export interface ToastMessage {
  message: string;
  type: 'success' | 'error' | 'info';
}

// Constants
export const IOT_DEVICE_MANAGER = {
  // Device slots (max 2 custom devices)
  MAX_DEVICES: 2,
  DEVICE_SLOTS: [0, 1] as const,
  
  // Validation
  MIN_POWER: 0.1,
  
  // Messages
  MESSAGES: {
    ADD_SUCCESS: (name: string) => `Đã thêm "${name}"`,
    ADD_ERROR: 'Thêm thất bại',
    EDIT_SUCCESS: 'Cập nhật thành công',
    EDIT_ERROR: 'Cập nhật thất bại',
    DELETE_SUCCESS: (name: string) => `Đã xóa "${name}"`,
    DELETE_ERROR: 'Xóa thất bại',
    CONTROL_ERROR: 'Điều khiển thất bại',
    VALIDATION_ERROR: 'Tên & công suất hợp lệ',
    EDIT_NO_CHANGE: 'Thay đổi ít nhất 1 thông tin',
  },
  
  // UI
  AUTO_SYNC_INTERVAL: 2000, // 2 seconds
} as const;

export type { CustomIoTDevice };
