import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

function toBool(value: unknown): unknown {
  if (value === undefined || value === null || value === '') return undefined;
  if (value === true || value === false) return value;
  const v = String(value).toLowerCase().trim();
  if (['true', '1', 'yes', 'on'].includes(v)) return true;
  if (['false', '0', 'no', 'off'].includes(v)) return false;
  return value;
}

function toNum(value: unknown): unknown {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? value : n;
}

export class CreateImageDto {
  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @Transform(({ value }) => toNum(value), { toClassOnly: true })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  displayOrder?: number;

  @ApiProperty({ example: true, required: false, default: true })
  @IsOptional()
  @Transform(({ value }) => toBool(value), { toClassOnly: true })
  @IsBoolean()
  isVisible?: boolean;
}
