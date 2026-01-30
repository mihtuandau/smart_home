import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsObject,
} from 'class-validator';

export class CreateAutomationRuleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsNotEmpty()
  conditionType: string; // "sensor" | "time" | "ai_prediction"

  @IsObject()
  @IsNotEmpty()
  conditions: any; // JSON conditions

  @IsObject()
  @IsNotEmpty()
  actions: any; // JSON actions

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateAutomationRuleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  conditionType?: string;

  @IsOptional()
  @IsObject()
  conditions?: any;

  @IsOptional()
  @IsObject()
  actions?: any;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
