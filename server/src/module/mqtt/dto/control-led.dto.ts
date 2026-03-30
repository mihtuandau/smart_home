import { IsBoolean, IsOptional, ValidateIf } from 'class-validator';

export class ControlLedDto {
  @IsOptional()
  @IsBoolean()
  led1?: boolean;

  @IsOptional()
  @IsBoolean()
  led2?: boolean;

  @ValidateIf((o) => o.led1 === undefined && o.led2 === undefined)
  @IsBoolean({ message: 'At least one LED must be specified' })
  _atLeastOne?: boolean;
}
