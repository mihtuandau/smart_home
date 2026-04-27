import { settingsApi } from '@/lib/api';
import {
  NotificationSettings,
  SystemSettings,
  UpdateNotificationSettingsDto,
  UpdateSystemSettingsDto,
} from '@/types/settings';

const normalizeNotificationSettings = (
  data: Partial<NotificationSettings> & Record<string, unknown>,
): NotificationSettings => ({
  emailAlerts: Boolean(data.emailAlerts),
  pushNotifications: Boolean(data.pushNotifications),
  deviceAlerts: Boolean(data.deviceAlerts),
  automationAlerts: Boolean(data.automationAlerts),
  systemAlerts: Boolean(data.systemAlerts),
  energyAlerts: Boolean(data.energyAlerts),
  dailyReport: Boolean(data.dailyReport),
  quietHoursFrom:
    typeof data.quietHoursFrom === 'string' ? data.quietHoursFrom : '22:00',
  quietHoursTo: typeof data.quietHoursTo === 'string' ? data.quietHoursTo : '06:00',
  emailFrequency:
    data.emailFrequency === 'hourly' ||
    data.emailFrequency === 'daily' ||
    data.emailFrequency === 'weekly' ||
    data.emailFrequency === 'never'
      ? data.emailFrequency
      : 'real-time',
});

const toUpdateDto = (
  data: UpdateNotificationSettingsDto,
): UpdateNotificationSettingsDto => ({
  emailAlerts: data.emailAlerts,
  pushNotifications: data.pushNotifications,
  deviceAlerts: data.deviceAlerts,
  automationAlerts: data.automationAlerts,
  systemAlerts: data.systemAlerts,
  energyAlerts: data.energyAlerts,
  dailyReport: data.dailyReport,
  quietHoursFrom: data.quietHoursFrom,
  quietHoursTo: data.quietHoursTo,
  emailFrequency: data.emailFrequency,
});

export const settingsService = {
  getNotificationSettings: async (): Promise<NotificationSettings> => {
    const response = await settingsApi.getNotificationSettings();
    return normalizeNotificationSettings(
      response.data as Partial<NotificationSettings> & Record<string, unknown>,
    );
  },

  updateNotificationSettings: async (
    data: UpdateNotificationSettingsDto,
  ): Promise<NotificationSettings> => {
    const response = await settingsApi.updateNotificationSettings(toUpdateDto(data));
    return normalizeNotificationSettings(
      response.data as Partial<NotificationSettings> & Record<string, unknown>,
    );
  },

  getSystemSettings: async (): Promise<SystemSettings> => {
    const response = await settingsApi.getSettings();
    return response.data as SystemSettings;
  },

  updateSystemSettings: async (data: UpdateSystemSettingsDto): Promise<SystemSettings> => {
    const response = await settingsApi.updateSettings(data);
    return response.data as SystemSettings;
  },
};