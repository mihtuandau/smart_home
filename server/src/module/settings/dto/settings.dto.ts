import {
  IsOptional,
  IsBoolean,
  IsString,
  IsNumber,
  IsInt,
} from 'class-validator';

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
  maxPowerConsumption?: number;

  @IsOptional()
  @IsBoolean()
  aiLearningEnabled?: boolean;

  @IsOptional()
  @IsInt()
  predictionHorizon?: number;
}
