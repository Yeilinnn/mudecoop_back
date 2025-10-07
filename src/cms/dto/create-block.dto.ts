import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateBlockDto {
  @ApiProperty({ example: 'Nuestra historia', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ example: 'En el año 2000 se fundó…', required: false })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiProperty({ example: 1, required: false, minimum: 1 })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const n = Number.parseInt(value as string, 10);
    return Number.isNaN(n) ? undefined : n;
  })
  @IsInt()
  @Min(1)
  displayOrder?: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
      const v = value.trim().toLowerCase();
      return v === 'true' || v === '1' || v === 'yes' || v === 'on';
    }
    return undefined;
  })
  @IsBoolean()
  isActive?: boolean;
}
