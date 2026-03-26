'use client';

import { TriangleAlert, X } from 'lucide-react';

interface AddIoTDeviceModalProps {
  open: boolean;
  onClose: () => void;
  name: string;
  onNameChange: (value: string) => void;
  power: string;
  onPowerChange: (value: string) => void;
  loading: boolean;
  error: string;
  onSubmit: () => void;
}

export function AddIoTDeviceModal({
  open,
  onClose,
  name,
  onNameChange,
  power,
  onPowerChange,
  loading,
  error,
  onSubmit,
}: AddIoTDeviceModalProps) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-card rounded-xl shadow-2xl max-w-md w-full transform transition-all">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Thêm thiết bị mới</h3>
              <p className="text-xs text-muted-foreground mt-1">Tối đa 2 thiết bị IoT</p>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Tên thiết bị <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="VD: Máy điều hòa, Tủ lạnh"
                disabled={loading}
                className="w-full px-3 py-2.5 text-sm text-foreground bg-card border border-border rounded-lg placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              />
              <p className="text-xs text-muted-foreground mt-1">Tên hiển thị cho thiết bị</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Công suất (W) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={power}
                onChange={(e) => onPowerChange(e.target.value)}
                placeholder="VD: 800"
                min="0.1"
                step="0.1"
                disabled={loading}
                className="w-full px-3 py-2.5 text-sm text-foreground bg-card border border-border rounded-lg placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Công suất điện khi thiết bị hoạt động
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 font-medium inline-flex items-center gap-1.5"><TriangleAlert className="w-4 h-4" />{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t border-border bg-muted/50 rounded-b-xl">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-foreground bg-card border border-border hover:bg-muted font-medium rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={onSubmit}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
            >
              {loading ? 'Đang lưu...' : 'Thêm'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
