import { IsOptional, IsEnum, IsBoolean, IsNumber, IsString } from 'class-validator';
import { DeviceStatus } from '@prisma/client';

export class UpdateDeviceDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(DeviceStatus)
  status?: DeviceStatus;

  @IsOptional()
  @IsNumber()
  value?: number;

  @IsOptional()
  @IsBoolean()
  manualMode?: boolean;

  @IsOptional()
  @IsNumber()
  powerConsumption?: number;
}
