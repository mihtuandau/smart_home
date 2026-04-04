export type NotificationFrequency =
  | 'real-time'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'never';

export interface NotificationSettings {
  emailAlerts: boolean;
  pushNotifications: boolean;
  deviceAlerts: boolean;
  automationAlerts: boolean;
  systemAlerts: boolean;
  energyAlerts: boolean;
  dailyReport: boolean;
  quietHoursFrom: string;
  quietHoursTo: string;
  emailFrequency: NotificationFrequency;
}

export interface UpdateNotificationSettingsDto
  extends Partial<NotificationSettings> {}
