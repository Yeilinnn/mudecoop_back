import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

function toBool(value: unknown): unknown {
  if (value === undefined || value === null || value === '') return undefined;
  if (value === true || value === false) return value;
  const v = String(value).toLowerCase().trim();
  if (['true', '1', 'yes', 'on'].includes(v)) return true;
  if (['false', '0', 'no', 'off'].includes(v)) return false;
  return value;
}

export class FilterGalleryDto {
  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @Transform(({ value }) => toBool(value), { toClassOnly: true })
  @IsBoolean()
  active?: boolean;
}
