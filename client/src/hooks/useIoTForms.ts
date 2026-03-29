
import { useState } from 'react';

export interface CustomIoTDevice {
  name: string;
  power: number;
  state: boolean;
}

export function useAddForm() {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [power, setPower] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setShowForm(false);
    setName('');
    setPower('');
    setError('');
  };

  return {
    showForm,
    setShowForm,
    name,
    setName,
    power,
    setPower,
    loading,
    setLoading,
    error,
    setError,
    reset,
  };
}

export function useEditForm() {
  const [index, setIndex] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [power, setPower] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const open = (deviceIndex: number, device: CustomIoTDevice) => {
    setIndex(deviceIndex);
    setName(device.name);
    setPower(String(device.power));
    setError('');
  };

  const reset = () => {
    setIndex(null);
    setName('');
    setPower('');
    setError('');
  };

  return {
    index,
    setIndex,
    name,
    setName,
    power,
    setPower,
    loading,
    setLoading,
    error,
    setError,
    open,
    reset,
  };
}

export function useToast() {
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const show = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
  };

  return { toast, setToast, show };
}
