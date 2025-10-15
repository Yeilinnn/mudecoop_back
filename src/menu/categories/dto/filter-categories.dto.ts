import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

const toBoolOrUndef = (v: any) => {
  if (v === undefined) return undefined;
  const s = String(v).toLowerCase();
  if (['true','1','yes','on'].includes(s)) return true;
  if (['false','0','no','off'].includes(s)) return false;
  return undefined;
};

export class FilterCategoriesDto {
  @ApiPropertyOptional({ description: 'true|false|1|0', example: true })
  @IsOptional() @Transform(({value}) => toBoolOrUndef(value)) @IsBoolean()
  active?: boolean;
}
