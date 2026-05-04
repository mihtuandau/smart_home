'use client';

import { useEffect } from 'react';
import { useLatestDeviceData } from '@/hooks/devices';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIoTDeviceState } from '@/hooks/iot';
import Toast from '@/components/ui/Toast';
import { AddIoTDeviceModal } from './AddIoTDeviceModal';
import { EditIoTDeviceModal } from './EditIoTDeviceModal';
import type { IoTDevice } from '@/hooks/iot';
import { Power } from 'lucide-react';

interface LatestData {
  device1?: IoTDevice;
  device2?: IoTDevice;
  [key: string]: unknown;
}

export default function IoTDeviceManager() {
  const { t } = useLanguage();
  const { data: latestRaw } = useLatestDeviceData(2000);
  const latest = (latestRaw as { data?: LatestData })?.data as LatestData | undefined;

  const {
    localDevices,
    syncDevicesFromServer,
    toast,
    setToast,
    showAddForm,
    setShowAddForm,
    addName,
    setAddName,
    addPower,
    setAddPower,
    addLoading,
    addError,
    handleAdd,
    resetAdd,
    editIndex,
    setEditIndex,
    editName,
    setEditName,
    editPower,
    setEditPower,
    editLoading,
    editError,
    handleEdit,
    resetEdit,
    deleteLoading,
    controlLoading,
    handleDelete,
    handleControl,
  } = useIoTDeviceState();

  const devices: (IoTDevice & { index: number })[] = [];
  if (localDevices[0]) {
    devices.push({ ...localDevices[0], index: 0 });
  }
  if (localDevices[1]) {
    devices.push({ ...localDevices[1], index: 1 });
  }

  useEffect(() => {
    syncDevicesFromServer(latest);
  }, [latest, syncDevicesFromServer]);

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <AddIoTDeviceModal
        open={showAddForm}
        onClose={resetAdd}
        name={addName}
        onNameChange={setAddName}
        power={addPower}
        onPowerChange={setAddPower}
        loading={addLoading}
        error={addError}
        onSubmit={() => handleAdd(addName, addPower)}
      />

      <EditIoTDeviceModal
        open={editIndex !== null}
        onClose={resetEdit}
        device={editIndex !== null ? localDevices[editIndex] : null}
        name={editName}
        onNameChange={setEditName}
        power={editPower}
        onPowerChange={setEditPower}
        loading={editLoading}
        error={editError}
        onSubmit={() => {
          if (editIndex !== null) handleEdit(editIndex, editName, editPower);
        }}
      />

      <div className="section-card shadow-sm border border-border p-4 sm:p-5 md:p-6">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-foreground">{t('devices.iotDevices')}</h3>
          </div>
          {devices.length < 1 && !showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full sm:w-auto px-3 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              {t('devices.addDevice')}
            </button>
          )}
        </div>

        {devices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">{t('devices.noDevice')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {devices.map((device) => (
              <div
                key={`device-${device.index}`}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-muted rounded-md hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      device.state ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {device.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {device.power}W · {device.pin ? `Pin ${device.pin}` : `Slot ${device.index + 1}`}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0 sm:ml-4">

                  <button
                    onClick={() => handleControl(device.index, !device.state)}
                    disabled={controlLoading === device.index}
                    title={device.state ? t('devices.clickToOff') : t('devices.clickToOn')}
                    className={`relative w-12 h-12 rounded-full flex items-center justify-center
                      transition-all duration-200 select-none
                      ${device.state
                        ? 'bg-green-500 shadow-[0_0_16px_4px_rgba(34,197,94,0.4)]'
                        : 'bg-muted shadow-inner'}
                      ${controlLoading === device.index ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-90 hover:brightness-105'}`}
                  >

                    <Power className={`w-5 h-5 transition-colors duration-200 ${device.state ? 'text-white' : 'text-gray-400'}`} />
                  </button>

                  <button
                    onClick={() => {
                      setEditIndex(device.index);
                      setEditName(device.name);
                      setEditPower(String(device.power));
                    }}
                    className="px-2.5 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-md transition-colors"
                  >
                    {t('devices.edit')}
                  </button>

                  <button
                    onClick={() => {
                      handleDelete(device.index, device.name);
                    }}
                    disabled={deleteLoading === device.index}
                    className="px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {t('devices.delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
