import { useState, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { deviceKeys } from './useDevices';
import { iotApi } from '@/lib/api/iot';
import type { AiAdvicePayload } from './useSocket';

export interface IoTDevice {
  name: string;
  power: number;
  state: boolean;
}

export type ToastType = 'success' | 'error' | 'info';

interface ToastState {
  message: string;
  type: ToastType;
}

interface LatestData {
  device1?: IoTDevice;
  device2?: IoTDevice;
  [key: string]: unknown;
}

/**
 * Custom hook for managing IoT device optimistic state and CRUD operations.
 * Handles optimistic updates with server reconciliation, pending operation tracking,
 * and toast feedback for all operations.
 */
export function useIoTDeviceState() {
  const queryClient = useQueryClient();
  const [localDevices, setLocalDevices] = useState<Record<number, IoTDevice | null>>({});
  const pendingOpsRef = useRef<Set<number>>(new Set());
  const [toast, setToast] = useState<ToastState | null>(null);

  // State for Add modal
  const [showAddForm, setShowAddForm] = useState(false);
  const [addName, setAddName] = useState('');
  const [addPower, setAddPower] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  // State for Edit modal
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editPower, setEditPower] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // State for Delete & Control
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [controlLoading, setControlLoading] = useState<number | null>(null);

  const showToast = useCallback((type: ToastType, message: string) => {
    setToast({ type, message });
  }, []);

  const syncDevicesFromServer = useCallback((latest: LatestData | undefined) => {
    if (!latest) return;

    setLocalDevices((prev) => {
      const next = { ...prev };
      if (!pendingOpsRef.current.has(0)) next[0] = latest.device1 || null;
      if (!pendingOpsRef.current.has(1)) next[1] = latest.device2 || null;
      return next;
    });
  }, []);

  const handleAdd = useCallback(
    async (name: string, power: string) => {
      if (!name.trim() || !power || parseFloat(power) <= 0) {
        setAddError('Tên & công suất hợp lệ');
        return;
      }
      setAddLoading(true);
      setAddError('');

      const newDevice: IoTDevice = {
        name: name.trim(),
        power: parseFloat(power),
        state: false,
      };

      const emptySlot = Object.entries(localDevices).find(([_, d]) => !d)?.[0] as string | undefined;
      const slotIndex = emptySlot ? parseInt(emptySlot) : -1;

      try {
        if (slotIndex >= 0) {
          setLocalDevices((prev) => ({ ...prev, [slotIndex]: newDevice }));
          pendingOpsRef.current.add(slotIndex);
        }

        await iotApi.addIoTDevice(name.trim(), parseFloat(power));
        showToast('success', `Đã thêm "${name}"`);
        setAddName('');
        setAddPower('');
        setShowAddForm(false);

        if (slotIndex >= 0) {
          await queryClient.invalidateQueries({ queryKey: deviceKeys.latestData() });
          pendingOpsRef.current.delete(slotIndex);
        }
      } catch {
        if (slotIndex >= 0) {
          setLocalDevices((prev) => ({ ...prev, [slotIndex]: null }));
          pendingOpsRef.current.delete(slotIndex);
        }
        setAddError('Thêm thất bại');
        showToast('error', 'Thêm thất bại');
      } finally {
        setAddLoading(false);
      }
    },
    [localDevices, queryClient, showToast],
  );

  const handleEdit = useCallback(
    async (index: number, editName: string, editPower: string) => {
      const device = localDevices[index];
      if (!device) return;

      const nameChanged = editName.trim() && editName.trim() !== device.name;
      const powerChanged = editPower && parseFloat(editPower) !== device.power;

      if (!nameChanged && !powerChanged) {
        setEditError('Thay đổi ít nhất 1 thông tin');
        return;
      }

      setEditLoading(true);
      setEditError('');

      const originalDevice = { ...device };
      const updatedDevice: IoTDevice = {
        name: editName.trim() || device.name,
        power: editPower ? parseFloat(editPower) : device.power,
        state: device.state,
      };

      setLocalDevices((prev) => ({ ...prev, [index]: updatedDevice }));
      pendingOpsRef.current.add(index);

      try {
        await iotApi.updateIoTDevice(index, {
          name: editName.trim() || undefined,
          power_consumption: editPower ? parseFloat(editPower) : undefined,
        });
        showToast('success', 'Cập nhật thành công');
        setEditIndex(null);
        setEditName('');
        setEditPower('');
        await queryClient.invalidateQueries({ queryKey: deviceKeys.latestData() });
        pendingOpsRef.current.delete(index);
      } catch {
        setLocalDevices((prev) => ({ ...prev, [index]: originalDevice }));
        pendingOpsRef.current.delete(index);
        setEditError('Cập nhật thất bại');
        showToast('error', 'Cập nhật thất bại');
      } finally {
        setEditLoading(false);
      }
    },
    [localDevices, queryClient, showToast],
  );

  const handleDelete = useCallback(
    async (index: number, name: string) => {
      if (!confirm(`Xóa "${name}"?`)) return;
      setDeleteLoading(index);

      const originalDevice = localDevices[index];

      setLocalDevices((prev) => ({ ...prev, [index]: null }));
      pendingOpsRef.current.add(index);

      try {
        await iotApi.deleteIoTDevice(index);
        showToast('success', `Đã xóa "${name}"`);
        await queryClient.invalidateQueries({ queryKey: deviceKeys.latestData() });
        pendingOpsRef.current.delete(index);
      } catch {
        setLocalDevices((prev) => ({ ...prev, [index]: originalDevice }));
        pendingOpsRef.current.delete(index);
        showToast('error', 'Xóa thất bại');
      } finally {
        setDeleteLoading(null);
      }
    },
    [localDevices, queryClient, showToast],
  );

  const handleControl = useCallback(
    async (index: number, state: boolean) => {
      const device = localDevices[index];
      if (!device) return;

      setControlLoading(index);
      const originalState = device.state;

      setLocalDevices((prev) => ({
        ...prev,
        [index]: { ...device, state },
      }));
      pendingOpsRef.current.add(index);

      try {
        await iotApi.controlIoTDevice({
          device1: index === 0 ? state : undefined,
          device2: index === 1 ? state : undefined,
        });
        await queryClient.invalidateQueries({ queryKey: deviceKeys.latestData() });
        pendingOpsRef.current.delete(index);
      } catch {
        setLocalDevices((prev) => ({
          ...prev,
          [index]: { ...device, state: originalState },
        }));
        pendingOpsRef.current.delete(index);
        showToast('error', 'Điều khiển thất bại');
      } finally {
        setControlLoading(null);
      }
    },
    [localDevices, queryClient, showToast],
  );

  const resetAdd = useCallback(() => {
    setShowAddForm(false);
    setAddError('');
    setAddName('');
    setAddPower('');
  }, []);

  const resetEdit = useCallback(() => {
    setEditIndex(null);
    setEditName('');
    setEditPower('');
    setEditError('');
  }, []);

  return {
    // Device state
    localDevices,
    syncDevicesFromServer,

    // Toast
    toast,
    setToast,
    showToast,

    // Add modal
    showAddForm,
    setShowAddForm,
    addName,
    setAddName,
    addPower,
    setAddPower,
    addLoading,
    addError,
    setAddError,
    handleAdd,
    resetAdd,

    // Edit modal
    editIndex,
    setEditIndex,
    editName,
    setEditName,
    editPower,
    setEditPower,
    editLoading,
    editError,
    setEditError,
    handleEdit,
    resetEdit,

    // Delete & Control
    deleteLoading,
    controlLoading,
    handleDelete,
    handleControl,
  };
}
