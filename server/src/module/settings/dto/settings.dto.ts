import {
  IsOptional,
  IsBoolean,
  IsString,
  IsNumber,
  IsIn,
  Matches,
} from 'class-validator';

const NOTIFICATION_FREQUENCY_VALUES = [
  'real-time',
  'hourly',
  'daily',
  'weekly',
  'never',
] as const;

export type NotificationFrequency =
  (typeof NOTIFICATION_FREQUENCY_VALUES)[number];

export class UpdateSystemSettingsDto {
  @IsOptional()
  @IsBoolean()
  autoRainProtection?: boolean;

  @IsOptional()
  @IsNumber()
  rainHumidityThreshold?: number;
}

export class UpdateNotificationSettingsDto {
  @IsOptional()
  @IsBoolean()
  emailAlerts?: boolean;

  @IsOptional()
  @IsBoolean()
  pushNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  deviceAlerts?: boolean;

  @IsOptional()
  @IsBoolean()
  systemAlerts?: boolean;

  @IsOptional()
  @IsBoolean()
  energyAlerts?: boolean;

  @IsOptional()
  @IsBoolean()
  dailyReport?: boolean;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'quietHoursFrom must be in HH:mm format',
  })
  quietHoursFrom?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'quietHoursTo must be in HH:mm format',
  })
  quietHoursTo?: string;

  @IsOptional()
  @IsString()
  @IsIn(NOTIFICATION_FREQUENCY_VALUES)
  emailFrequency?: NotificationFrequency;
}
