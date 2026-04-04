'use client';

import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { BellRing, ChartColumn, Mail, Moon, Plug, Smartphone, TriangleAlert, Zap } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { settingsService } from '@/services';
import { NotificationFrequency, NotificationSettings as NotificationSettingsType } from '@/types/settings';

type NotificationToggleKey =
  | 'emailAlerts'
  | 'pushNotifications'
  | 'deviceAlerts'
  | 'automationAlerts'
  | 'systemAlerts'
  | 'energyAlerts'
  | 'dailyReport';

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettingsType = {
  emailAlerts: true,
  pushNotifications: true,
  deviceAlerts: true,
  automationAlerts: true,
  systemAlerts: true,
  energyAlerts: true,
  dailyReport: true,
  quietHoursFrom: '22:00',
  quietHoursTo: '06:00',
  emailFrequency: 'real-time',
};

export default function NotificationSettings() {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<NotificationSettingsType>(
    DEFAULT_NOTIFICATION_SETTINGS,
  );
  const [initialSettings, setInitialSettings] =
    useState<NotificationSettingsType>(DEFAULT_NOTIFICATION_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(notifications) !== JSON.stringify(initialSettings);
  }, [initialSettings, notifications]);

  useEffect(() => {
    const loadNotificationSettings = async () => {
      try {
        setIsLoading(true);
        const response = await settingsService.getNotificationSettings();
        setNotifications(response);
        setInitialSettings(response);
      } catch {
        toast.error(t('settings.notifications.loadError'));
      } finally {
        setIsLoading(false);
      }
    };

    loadNotificationSettings();
  }, [t]);

  const handleChange = (
    key: keyof NotificationSettingsType,
    value: boolean | string,
  ) => {
    setNotifications((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!hasUnsavedChanges) {
      return;
    }

    try {
      setIsSaving(true);
      const response = await settingsService.updateNotificationSettings(
        notifications,
      );
      setNotifications(response);
      setInitialSettings(response);
      toast.success(t('settings.notifications.saved'));
    } catch {
      toast.error(t('settings.notifications.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const notificationOptions = [
    {
      key: 'emailAlerts' as NotificationToggleKey,
      icon: <Mail className="w-4 h-4" />,
      label: t('settings.notifications.options.emailAlerts.label'),
      description: t('settings.notifications.options.emailAlerts.description'),
    },
    {
      key: 'pushNotifications' as NotificationToggleKey,
      icon: <Smartphone className="w-4 h-4" />,
      label: t('settings.notifications.options.pushNotifications.label'),
      description: t('settings.notifications.options.pushNotifications.description'),
    },
    {
      key: 'deviceAlerts' as NotificationToggleKey,
      icon: <Plug className="w-4 h-4" />,
      label: t('settings.notifications.options.deviceAlerts.label'),
      description: t('settings.notifications.options.deviceAlerts.description'),
    },
    {
      key: 'automationAlerts' as NotificationToggleKey,
      icon: <BellRing className="w-4 h-4" />,
      label: t('settings.notifications.options.automationAlerts.label'),
      description: t('settings.notifications.options.automationAlerts.description'),
    },
    {
      key: 'systemAlerts' as NotificationToggleKey,
      icon: <TriangleAlert className="w-4 h-4" />,
      label: t('settings.notifications.options.systemAlerts.label'),
      description: t('settings.notifications.options.systemAlerts.description'),
    },
    {
      key: 'energyAlerts' as NotificationToggleKey,
      icon: <Zap className="w-4 h-4" />,
      label: t('settings.notifications.options.energyAlerts.label'),
      description: t('settings.notifications.options.energyAlerts.description'),
    },
    {
      key: 'dailyReport' as NotificationToggleKey,
      icon: <ChartColumn className="w-4 h-4" />,
      label: t('settings.notifications.options.dailyReport.label'),
      description: t('settings.notifications.options.dailyReport.description'),
    },
  ];

  return (
    <div className="section-card shadow-sm p-4 sm:p-6 md:p-8 space-y-6 bg-card/95">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">{t('settings.notifications.title')}</h2>
        <p className="text-xs sm:text-sm text-muted-foreground">{t('settings.notifications.subtitle')}</p>
      </div>

      <div className="space-y-4">
        {notificationOptions.map((option) => (
          <div
            key={option.key}
            className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 p-4 border border-border rounded-lg bg-background/60 hover:bg-muted/60 transition"
          >
            <div className="flex-1">
              <h3 className="text-sm sm:text-base font-semibold text-foreground">
                <span className="inline-flex items-center gap-2">{option.icon} {option.label}</span>
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">{option.description}</p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer ml-4">
              <input
                type="checkbox"
                checked={notifications[option.key]}
                onChange={(e) => handleChange(option.key, e.target.checked)}
                className="sr-only peer"
                disabled={isLoading || isSaving}
              />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-ring rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-primary-foreground after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        ))}
      </div>

      <div className="border-t border-border pt-6">
        <h3 className="text-sm sm:text-base font-semibold text-foreground mb-4 inline-flex items-center gap-2"><Moon className="w-4 h-4" />{t('settings.notifications.quietHours')}</h3>
        <p className="text-xs sm:text-sm text-muted-foreground mb-4">
          {t('settings.notifications.quietHoursDescription')}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('settings.notifications.from')}
            </label>
            <input
              type="time"
              value={notifications.quietHoursFrom}
              onChange={(e) => handleChange('quietHoursFrom', e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={isLoading || isSaving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('settings.notifications.to')}
            </label>
            <input
              type="time"
              value={notifications.quietHoursTo}
              onChange={(e) => handleChange('quietHoursTo', e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={isLoading || isSaving}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <h3 className="text-sm sm:text-base font-semibold text-foreground mb-4 inline-flex items-center gap-2"><Mail className="w-4 h-4" />{t('settings.notifications.emailFrequency')}</h3>

        <select
          className="w-full sm:w-64 px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          value={notifications.emailFrequency}
          onChange={(e) =>
            handleChange('emailFrequency', e.target.value as NotificationFrequency)
          }
          disabled={isLoading || isSaving}
        >
          <option value="real-time">{t('settings.notifications.frequency.realtime')}</option>
          <option value="hourly">{t('settings.notifications.frequency.hourly')}</option>
          <option value="daily">{t('settings.notifications.frequency.daily')}</option>
          <option value="weekly">{t('settings.notifications.frequency.weekly')}</option>
          <option value="never">{t('settings.notifications.frequency.never')}</option>
        </select>
      </div>

      <div className="border-t border-border pt-6 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs sm:text-sm text-muted-foreground">
          {isLoading
            ? t('common.loading')
            : hasUnsavedChanges
              ? t('settings.notifications.unsavedChanges')
              : t('settings.notifications.synced')}
        </span>

        <button
          type="button"
          onClick={handleSave}
          disabled={isLoading || isSaving || !hasUnsavedChanges}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? t('settings.notifications.saving') : t('common.save')}
        </button>
      </div>
    </div>
  );
}
