import { useCallback, useState } from 'react';
import { ToastState, ToastType } from './iotDeviceTypes';

export function useIoTDeviceUiState() {
  const [toast, setToast] = useState<ToastState | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [addName, setAddName] = useState('');
  const [addPower, setAddPower] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editPower, setEditPower] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [controlLoading, setControlLoading] = useState<number | null>(null);

  const showToast = useCallback((type: ToastType, message: string) => {
    setToast({ type, message });
  }, []);

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
    toast,
    setToast,
    showToast,

    showAddForm,
    setShowAddForm,
    addName,
    setAddName,
    addPower,
    setAddPower,
    addLoading,
    setAddLoading,
    addError,
    setAddError,

    editIndex,
    setEditIndex,
    editName,
    setEditName,
    editPower,
    setEditPower,
    editLoading,
    setEditLoading,
    editError,
    setEditError,

    deleteLoading,
    setDeleteLoading,
    controlLoading,
    setControlLoading,

    resetAdd,
    resetEdit,
  };
}
