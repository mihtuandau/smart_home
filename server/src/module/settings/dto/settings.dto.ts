import {
  IsOptional,
  IsBoolean,
  IsString,
  IsNumber,
  IsInt,
  IsIn,
  Min,
  Max,
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
  autoLightEnabled?: boolean;

  @IsOptional()
  @IsString()
  lightOnTime?: string;

  @IsOptional()
  @IsString()
  lightOffTime?: string;

  @IsOptional()
  @IsInt()
  lightThreshold?: number;

  @IsOptional()
  @IsBoolean()
  autoRainProtection?: boolean;

  @IsOptional()
  @IsNumber()
  rainHumidityThreshold?: number;

  @IsOptional()
  @IsBoolean()
  powerSaveMode?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(10000)
  maxPowerConsumption?: number;

  @IsOptional()
  @IsBoolean()
  aiLearningEnabled?: boolean;

  @IsOptional()
  @IsInt()
  predictionHorizon?: number;
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
  automationAlerts?: boolean;

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
