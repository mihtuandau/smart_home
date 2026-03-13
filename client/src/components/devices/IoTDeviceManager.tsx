'use client';

import { useEffect } from 'react';
import { useLatestDeviceData } from '@/hooks/useDevices';
import { useIoTDeviceState } from '@/hooks/useIoTDeviceState';
import Toast from '@/components/ui/Toast';
import { AddIoTDeviceModal } from './AddIoTDeviceModal';
import { EditIoTDeviceModal } from './EditIoTDeviceModal';
import type { IoTDevice } from '@/hooks/useIoTDeviceState';

interface LatestData {
  device1?: IoTDevice;
  device2?: IoTDevice;
  [key: string]: unknown;
}

export default function IoTDeviceManager() {
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

  // Calculate displayed devices
  const devices: (IoTDevice & { index: number })[] = [];
  if (localDevices[0]) devices.push({ ...localDevices[0], index: 0 });
  if (localDevices[1]) devices.push({ ...localDevices[1], index: 1 });

  // Sync with server data
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

      {/* Add Modal */}
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

      {/* Edit Modal */}
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

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-gray-900">Thiết bị IoT</h3>
            <p className="text-xs text-gray-500 mt-1">Tối đa 2 thiết bị · Cập nhật qua MQTT</p>
          </div>
          {devices.length < 2 && !showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="px-3 py-1.5 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Thêm thiết bị
            </button>
          )}
        </div>

        {/* Device List */}
        {devices.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">Chưa có thiết bị nào</p>
          </div>
        ) : (
          <div className="space-y-2">
            {devices.map((device) => (
              <div
                key={device.index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      device.state ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {device.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {device.power}W · Slot {device.index + 1}
                    </p>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  {/* Toggle */}
                  <button
                    onClick={() => handleControl(device.index, !device.state)}
                    disabled={controlLoading === device.index}
                    className={`w-10 h-6 rounded-full transition-colors ${
                      device.state ? 'bg-green-500' : 'bg-gray-300'
                    } ${controlLoading === device.index ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span
                      className={`block w-5 h-5 rounded-full bg-white transition-transform mx-0.5 ${
                        device.state ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => {
                      setEditIndex(device.index);
                      setEditName(device.name);
                      setEditPower(String(device.power));
                    }}
                    className="px-2.5 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    Sửa
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(device.index, device.name)}
                    disabled={deleteLoading === device.index}
                    className="px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Xóa
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
