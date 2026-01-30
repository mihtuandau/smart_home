import {
  IsOptional,
  IsBoolean,
  IsString,
  IsNumber,
  IsInt,
} from 'class-validator';

export class UpdateSystemSettingsDto {
  // Lighting settings
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

  // Rain protection
  @IsOptional()
  @IsBoolean()
  autoRainProtection?: boolean;

  @IsOptional()
  @IsNumber()
  rainHumidityThreshold?: number;

  // Energy saving
  @IsOptional()
  @IsBoolean()
  powerSaveMode?: boolean;

  @IsOptional()
  @IsNumber()
  maxPowerConsumption?: number;

  // AI settings
  @IsOptional()
  @IsBoolean()
  aiLearningEnabled?: boolean;

  @IsOptional()
  @IsInt()
  predictionHorizon?: number;
}
