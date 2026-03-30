import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useIoTDeviceUiState } from './useIoTDeviceUiState';
import { useIoTDeviceActions } from './useIoTDeviceActions';
export type { IoTDevice, ToastType, ToastState, LatestData } from './iotDeviceTypes';
import type { IoTDevice } from './iotDeviceTypes';

export function useIoTDeviceState() {
  const queryClient = useQueryClient();
  const [localDevices, setLocalDevices] = useState<Record<number, IoTDevice | null>>({});
  const pendingOpsRef = useRef<Set<number>>(new Set());
  const ui = useIoTDeviceUiState();

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
