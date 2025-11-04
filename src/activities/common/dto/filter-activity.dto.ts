// src/activity/common/dto/filter-activity.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBooleanString, IsDateString, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class FilterActivityDto {
  @ApiPropertyOptional({ description: 'Buscar por título (contiene)' })
  @IsOptional() @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Solo activos', example: 'true' })
  @IsOptional() @IsBooleanString()
  active?: string;

  @ApiPropertyOptional({ description: 'Desde fecha (ISO)', example: '2025-01-01T00:00:00Z' })
  @IsOptional() @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'Hasta fecha (ISO)', example: '2025-12-31T23:59:59Z' })
  @IsOptional() @IsDateString()
  to?: string;

  @ApiPropertyOptional({ enum: ['start_at', 'created_at'], default: 'start_at' })
  @IsOptional() @IsIn(['start_at', 'created_at'])
  orderBy?: 'start_at' | 'created_at';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'ASC' })
  @IsOptional() @IsIn(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC';

  @ApiPropertyOptional({ example: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  limit?: number;
}
