import { useCallback } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { deviceKeys } from '../devices';
import { iotApi } from '@/lib/api/iot';
import { IoTDevice, LatestData, ToastType } from './iotDeviceTypes';

interface UiActions {
  showToast: (type: ToastType, message: string) => void;
  setAddLoading: (value: boolean) => void;
  setAddError: (value: string) => void;
  setAddName: (value: string) => void;
  setAddPower: (value: string) => void;
  setShowAddForm: (value: boolean) => void;
  setEditLoading: (value: boolean) => void;
  setEditError: (value: string) => void;
  setEditIndex: (value: number | null) => void;
  setEditName: (value: string) => void;
  setEditPower: (value: string) => void;
  setDeleteLoading: (value: number | null) => void;
  setControlLoading: (value: number | null) => void;
}

interface UseIoTDeviceActionsParams {
  queryClient: QueryClient;
  localDevices: Record<number, IoTDevice | null>;
  setLocalDevices: Dispatch<SetStateAction<Record<number, IoTDevice | null>>>;
  pendingOpsRef: MutableRefObject<Set<number>>;
  ui: UiActions;
}

export function useIoTDeviceActions({
  queryClient,
  localDevices,
  setLocalDevices,
  pendingOpsRef,
  ui,
}: UseIoTDeviceActionsParams) {
  const syncDevicesFromServer = useCallback((latest: LatestData | undefined) => {
    if (!latest) return;

    setLocalDevices((prev) => {
      const next: Record<number, IoTDevice | null> = {};

      next[0] = pendingOpsRef.current.has(0) ? (prev[0] || null) : (latest.device1 || null);
      next[1] = pendingOpsRef.current.has(1) ? (prev[1] || null) : (latest.device2 || null);

      return next;
    });
  }, [pendingOpsRef, setLocalDevices]);

  const handleAdd = useCallback(async (name: string, power: string) => {
    if (!name.trim() || !power || parseFloat(power) <= 0) {
      ui.setAddError('Tên & công suất hợp lệ');
      return;
    }

    ui.setAddLoading(true);
    ui.setAddError('');

    const newDevice: IoTDevice = {
      name: name.trim(),
      power: parseFloat(power),
      state: false,
    };

    const emptySlot = Object.entries(localDevices).find(([, d]) => !d)?.[0] as string | undefined;
    const slotIndex = emptySlot ? parseInt(emptySlot, 10) : -1;

    try {
      if (slotIndex >= 0) {
        setLocalDevices((prev) => ({ ...prev, [slotIndex]: newDevice }));
        pendingOpsRef.current.add(slotIndex);
      }

      await iotApi.addIoTDevice(name.trim(), parseFloat(power));
      ui.showToast('success', `Đã thêm "${name}"`);
      ui.setAddName('');
      ui.setAddPower('');
      ui.setShowAddForm(false);

      await queryClient.invalidateQueries({ queryKey: deviceKeys.latestData(), refetchType: 'all' });
      await queryClient.invalidateQueries({ queryKey: deviceKeys.stats(), refetchType: 'all' });

      if (slotIndex >= 0) {
        pendingOpsRef.current.delete(slotIndex);
      }
    } catch {
      if (slotIndex >= 0) {
        setLocalDevices((prev) => ({ ...prev, [slotIndex]: null }));
        pendingOpsRef.current.delete(slotIndex);
      }
      ui.setAddError('Thêm thất bại');
      ui.showToast('error', 'Thêm thất bại');
    } finally {
      ui.setAddLoading(false);
    }
  }, [localDevices, pendingOpsRef, queryClient, setLocalDevices, ui]);

  const handleEdit = useCallback(async (index: number, editName: string, editPower: string) => {
    const device = localDevices[index];
    if (!device) return;

    const nameChanged = editName.trim() && editName.trim() !== device.name;
    const powerChanged = editPower && parseFloat(editPower) !== device.power;

    if (!nameChanged && !powerChanged) {
      ui.setEditError('Thay đổi ít nhất 1 thông tin');
      return;
    }

    ui.setEditLoading(true);
    ui.setEditError('');

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
      ui.showToast('success', 'Cập nhật thành công');
      ui.setEditIndex(null);
      ui.setEditName('');
      ui.setEditPower('');
      await queryClient.invalidateQueries({ queryKey: deviceKeys.latestData(), refetchType: 'all' });
      await queryClient.invalidateQueries({ queryKey: deviceKeys.stats(), refetchType: 'all' });
      pendingOpsRef.current.delete(index);
    } catch {
      setLocalDevices((prev) => ({ ...prev, [index]: originalDevice }));
      pendingOpsRef.current.delete(index);
      ui.setEditError('Cập nhật thất bại');
      ui.showToast('error', 'Cập nhật thất bại');
    } finally {
      ui.setEditLoading(false);
    }
  }, [localDevices, pendingOpsRef, queryClient, setLocalDevices, ui]);

  const handleDelete = useCallback(async (index: number, name: string) => {
    if (!confirm(`Xóa "${name}"?`)) return;

    const originalDevice = localDevices[index];

    ui.setDeleteLoading(index);
    setLocalDevices((prev) => ({ ...prev, [index]: null }));
    pendingOpsRef.current.add(index);

    try {
      await iotApi.deleteIoTDevice(index);

      ui.showToast('success', `Đã xóa "${name}"`);

      pendingOpsRef.current.add(0);
      pendingOpsRef.current.add(1);

      await new Promise((resolve) => setTimeout(resolve, 3000));

      pendingOpsRef.current.clear();

      await queryClient.invalidateQueries({ queryKey: deviceKeys.latestData(), refetchType: 'all' });
      await queryClient.invalidateQueries({ queryKey: deviceKeys.stats(), refetchType: 'all' });
    } catch {
      setLocalDevices((prev) => ({ ...prev, [index]: originalDevice }));
      pendingOpsRef.current.clear();
      ui.showToast('error', 'Xóa thất bại');
    } finally {
      ui.setDeleteLoading(null);
    }
  }, [localDevices, pendingOpsRef, queryClient, setLocalDevices, ui]);

  const handleControl = useCallback(async (index: number, state: boolean) => {
    const device = localDevices[index];
    if (!device) return;

    ui.setControlLoading(index);
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
      await queryClient.invalidateQueries({ queryKey: deviceKeys.latestData(), refetchType: 'all' });
      pendingOpsRef.current.delete(index);
    } catch {
      setLocalDevices((prev) => ({
        ...prev,
        [index]: { ...device, state: originalState },
      }));
      pendingOpsRef.current.delete(index);
      ui.showToast('error', 'Điều khiển thất bại');
    } finally {
      ui.setControlLoading(null);
    }
  }, [localDevices, pendingOpsRef, queryClient, setLocalDevices, ui]);

  return {
    syncDevicesFromServer,
    handleAdd,
    handleEdit,
    handleDelete,
    handleControl,
  };
}
