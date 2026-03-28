'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Bell, ChartColumn, Clock3, Pencil, Plus, Plug } from 'lucide-react';

interface CreateAutomationModalProps {
  rule?: any;
  onClose: () => void;
  onCreate: (data: any) => void;
  onUpdate: (id: string, data: any) => void;
}

export default function CreateAutomationModal({
  rule,
  onClose,
  onCreate,
  onUpdate,
}: CreateAutomationModalProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    conditionType: 'sensor', // sensor | time
    sensor: '',
    operator: '>',
    value: '',
    time: '',
    device: '',
    action: 'ON',
    notificationType: '',
    isActive: true,
  });

  useEffect(() => {
    if (rule) {
      setFormData({
        name: rule.name || '',
        description: rule.description || '',
        conditionType: rule.condition?.sensor ? 'sensor' : 'time',
        sensor: rule.condition?.sensor || '',
        operator: rule.condition?.operator || '>',
        value: rule.condition?.value || '',
        time: rule.condition?.time || '',
        device: rule.action?.device || '',
        action: rule.action?.status || 'ON',
        notificationType: rule.action?.notification || '',
        isActive: rule.isActive || true,
      });
    }
  }, [rule]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const condition =
      formData.conditionType === 'sensor'
        ? {
            sensor: formData.sensor,
            operator: formData.operator,
            value: formData.value,
          }
        : {
            time: formData.time,
          };

    const action = formData.notificationType
      ? {
          notification: formData.notificationType,
        }
      : {
          device: formData.device,
          status: formData.action,
        };

    const data = {
      name: formData.name,
      description: formData.description,
      condition,
      action,
      isActive: formData.isActive,
    };

    if (rule) {
      onUpdate(rule.id, data);
    } else {
      onCreate(data);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 inline-flex items-center gap-2">
            {rule ? <Pencil className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {rule ? t('automation.editRule') : t('automation.createNew')}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">{t('automation.basicInfo')}</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('automation.ruleName')}
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('automation.exampleRule')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('automation.descriptionOptional')}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('automation.exampleDescription')}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Condition */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900">{t('automation.condition')}</h3>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, conditionType: 'sensor' })}
                className={`p-3 rounded-lg border-2 transition ${
                  formData.conditionType === 'sensor'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200'
                }`}
              >
                <span className="inline-flex items-center gap-2"><ChartColumn className="w-4 h-4" />{t('automation.sensor')}</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, conditionType: 'time' })}
                className={`p-3 rounded-lg border-2 transition ${
                  formData.conditionType === 'time'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200'
                }`}
              >
                <span className="inline-flex items-center gap-2"><Clock3 className="w-4 h-4" />{t('automation.time')}</span>
              </button>
            </div>

            {formData.conditionType === 'sensor' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('automation.sensor')}
                  </label>
                  <select
                    value={formData.sensor}
                    onChange={(e) => setFormData({ ...formData, sensor: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">{t('automation.selectSensor')}</option>
                    <option value="temperature">{t('automation.temperatureSensor')}</option>
                    <option value="humidity">{t('automation.humiditySensor')}</option>
                    <option value="pressure">{t('automation.pressureSensor')}</option>
                    <option value="light">{t('automation.lightSensor')}</option>
                    <option value="motion">{t('automation.motionSensor')}</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('automation.operator')}
                    </label>
                    <select
                      value={formData.operator}
                      onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value=">">&gt; {t('automation.greaterThan')}</option>
                      <option value="<">&lt; {t('automation.lessThan')}</option>
                      <option value=">=">&gt;= {t('automation.greaterOrEqual')}</option>
                      <option value="<=">&lt;= {t('automation.lessOrEqual')}</option>
                      <option value="==">=== {t('automation.equal')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('automation.value')}
                    </label>
                    <input
                      type="number"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      placeholder={t('automation.exampleValue')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('automation.time')}
                </label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">{t('automation.triggerDaily')}</p>
              </div>
            )}
          </div>

          {/* Action */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900">{t('automation.action')}</h3>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, notificationType: '' })}
                className={`p-3 rounded-lg border-2 transition ${
                  !formData.notificationType
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200'
                }`}
              >
                <span className="inline-flex items-center gap-2"><Plug className="w-4 h-4" />{t('automation.device')}</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, notificationType: 'alert' })}
                className={`p-3 rounded-lg border-2 transition ${
                  formData.notificationType
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200'
                }`}
              >
                <span className="inline-flex items-center gap-2"><Bell className="w-4 h-4" />{t('automation.notification')}</span>
              </button>
            </div>

            {!formData.notificationType ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('automation.device')}
                  </label>
                  <select
                    value={formData.device}
                    onChange={(e) => setFormData({ ...formData, device: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">{t('automation.selectDevice')}</option>
                    <option value="LED_1">{t('devices.led1')}</option>
                    <option value="LED_2">{t('devices.led2')}</option>
                    <option value="SERVO">Servo Motor</option>
                    <option value="FAN">{t('automation.fan')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('automation.action')}
                  </label>
                  <select
                    value={formData.action}
                    onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ON">{t('devices.on')}</option>
                    <option value="OFF">{t('devices.off')}</option>
                    <option value="TOGGLE">{t('automation.toggle')}</option>
                  </select>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('automation.notificationType')}
                </label>
                <select
                  value={formData.notificationType}
                  onChange={(e) => setFormData({ ...formData, notificationType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="alert">{t('automation.alert')}</option>
                  <option value="info">{t('automation.info')}</option>
                  <option value="success">{t('automation.success')}</option>
                </select>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="border-t pt-6 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              {t('automation.cancel')}
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              {rule ? t('automation.update') : t('automation.createRule')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
