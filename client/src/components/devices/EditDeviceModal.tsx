'use client';

import { CustomIoTDevice } from '@/hooks/useIoTForms';

interface EditDeviceModalProps {
  isOpen: boolean;
  device: CustomIoTDevice | null;
  name: string;
  power: string;
  loading: boolean;
  error: string;
  onNameChange: (value: string) => void;
  onPowerChange: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export default function EditDeviceModal({
  isOpen,
  device,
  name,
  power,
  loading,
  error,
  onNameChange,
  onPowerChange,
  onSubmit,
  onClose,
}: EditDeviceModalProps) {
  if (!isOpen || !device) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Chỉnh sửa thiết bị</h3>
              <p className="text-xs text-gray-500 mt-1">{device.name}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Tên thiết bị <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder={device.name}
                disabled={loading}
                className="w-full px-3 py-2.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              />
              <p className="text-xs text-gray-500 mt-1">Để trống để giữ tên hiện tại</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Công suất (W) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={power}
                onChange={(e) => onPowerChange(e.target.value)}
                placeholder={String(device.power)}
                min="0.1"
                step="0.1"
                disabled={loading}
                className="w-full px-3 py-2.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              />
              <p className="text-xs text-gray-500 mt-1">Để trống để giữ giá trị hiện tại</p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 font-medium">⚠ {error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 font-medium rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={onSubmit}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
            >
              {loading ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
