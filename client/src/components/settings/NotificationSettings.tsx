'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { BellRing, ChartColumn, Mail, Moon, Plug, Smartphone, TriangleAlert, Zap } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function NotificationSettings() {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    pushNotifications: true,
    deviceAlerts: true,
    automationAlerts: true,
    systemAlerts: true,
    energyAlerts: true,
    dailyReport: true,
  });

  const handleChange = (key: string, value: boolean) => {
    setNotifications({ ...notifications, [key]: value });
    toast.success(t('settings.notifications.saved'));
  };

  const notificationOptions = [
    {
      key: 'emailAlerts',
      icon: <Mail className="w-4 h-4" />,
      label: t('settings.notifications.options.emailAlerts.label'),
      description: t('settings.notifications.options.emailAlerts.description'),
    },
    {
      key: 'pushNotifications',
      icon: <Smartphone className="w-4 h-4" />,
      label: t('settings.notifications.options.pushNotifications.label'),
      description: t('settings.notifications.options.pushNotifications.description'),
    },
    {
      key: 'deviceAlerts',
      icon: <Plug className="w-4 h-4" />,
      label: t('settings.notifications.options.deviceAlerts.label'),
      description: t('settings.notifications.options.deviceAlerts.description'),
    },
    {
      key: 'automationAlerts',
      icon: <BellRing className="w-4 h-4" />,
      label: t('settings.notifications.options.automationAlerts.label'),
      description: t('settings.notifications.options.automationAlerts.description'),
    },
    {
      key: 'systemAlerts',
      icon: <TriangleAlert className="w-4 h-4" />,
      label: t('settings.notifications.options.systemAlerts.label'),
      description: t('settings.notifications.options.systemAlerts.description'),
    },
    {
      key: 'energyAlerts',
      icon: <Zap className="w-4 h-4" />,
      label: t('settings.notifications.options.energyAlerts.label'),
      description: t('settings.notifications.options.energyAlerts.description'),
    },
    {
      key: 'dailyReport',
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
                checked={notifications[option.key as keyof typeof notifications]}
                onChange={(e) => handleChange(option.key, e.target.checked)}
                className="sr-only peer"
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
            <input type="time" defaultValue="22:00" className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('settings.notifications.to')}
            </label>
            <input type="time" defaultValue="06:00" className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <h3 className="text-sm sm:text-base font-semibold text-foreground mb-4 inline-flex items-center gap-2"><Mail className="w-4 h-4" />{t('settings.notifications.emailFrequency')}</h3>

        <select className="w-full sm:w-64 px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="real-time">{t('settings.notifications.frequency.realtime')}</option>
          <option value="hourly">{t('settings.notifications.frequency.hourly')}</option>
          <option value="daily">{t('settings.notifications.frequency.daily')}</option>
          <option value="weekly">{t('settings.notifications.frequency.weekly')}</option>
          <option value="never">{t('settings.notifications.frequency.never')}</option>
        </select>
      </div>
    </div>
  );
}
