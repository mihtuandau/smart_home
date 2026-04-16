import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useIoTDeviceUiState } from './useIoTDeviceUiState';
import { useIoTDeviceActions } from './useIoTDeviceActions';
export type { IoTDevice, ToastType, ToastState, LatestData } from './iotDeviceTypes';
import type { IoTDevice } from './iotDeviceTypes';

const IOT_LOCAL_STORAGE_KEY = 'iot_local_devices_v1';

function sanitizeLocalDevices(input: unknown): Record<number, IoTDevice | null> {
  const base: Record<number, IoTDevice | null> = { 0: null, 1: null };

  if (!input || typeof input !== 'object') {
    return base;
  }

  const data = input as Record<string, unknown>;

  for (const slot of [0, 1]) {
    const value = data[String(slot)];
    if (!value || typeof value !== 'object') {
      continue;
    }

    const maybeDevice = value as Record<string, unknown>;
    if (
      typeof maybeDevice.name === 'string' &&
      typeof maybeDevice.power === 'number' &&
      typeof maybeDevice.state === 'boolean'
    ) {
      base[slot] = {
        name: maybeDevice.name,
        power: maybeDevice.power,
        state: maybeDevice.state,
        pin: typeof maybeDevice.pin === 'number' ? maybeDevice.pin : undefined,
      };
    }
  }

  return base;
}

function loadInitialLocalDevices(): Record<number, IoTDevice | null> {
  const fallback: Record<number, IoTDevice | null> = { 0: null, 1: null };

  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(IOT_LOCAL_STORAGE_KEY);
    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw);
    return sanitizeLocalDevices(parsed);
  } catch {
    return fallback;
  }
}

export function useIoTDeviceState() {
  const queryClient = useQueryClient();
  const [localDevices, setLocalDevices] = useState<Record<number, IoTDevice | null>>(
    () => loadInitialLocalDevices(),
  );
  const pendingOpsRef = useRef<Set<number>>(new Set());
  const ui = useIoTDeviceUiState();

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(
      IOT_LOCAL_STORAGE_KEY,
      JSON.stringify(localDevices),
    );
  }, [localDevices]);

  const {
    syncDevicesFromServer,
    handleAdd,
    handleEdit,
    handleDelete,
    handleControl,
  } = useIoTDeviceActions({
    queryClient,
    localDevices,
    setLocalDevices,
    pendingOpsRef,
    ui,
  });

  return {
    localDevices,
    syncDevicesFromServer,

    toast: ui.toast,
    setToast: ui.setToast,
    showToast: ui.showToast,

    showAddForm: ui.showAddForm,
    setShowAddForm: ui.setShowAddForm,
    addName: ui.addName,
    setAddName: ui.setAddName,
    addPower: ui.addPower,
    setAddPower: ui.setAddPower,
    addLoading: ui.addLoading,
    addError: ui.addError,
    setAddError: ui.setAddError,
    handleAdd,
    resetAdd: ui.resetAdd,

    editIndex: ui.editIndex,
    setEditIndex: ui.setEditIndex,
    editName: ui.editName,
    setEditName: ui.setEditName,
    editPower: ui.editPower,
    setEditPower: ui.setEditPower,
    editLoading: ui.editLoading,
    editError: ui.editError,
    setEditError: ui.setEditError,
    handleEdit,
    resetEdit: ui.resetEdit,

    deleteLoading: ui.deleteLoading,
    controlLoading: ui.controlLoading,
    handleDelete,
    handleControl,
  };
}
