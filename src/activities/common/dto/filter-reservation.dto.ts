// src/activity/common/dto/filter-reservation.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ActivityReservationStatus } from '../activity-status.enum';

export class FilterReservationDto {
  @ApiPropertyOptional({ description: 'Filtrar por actividad', example: 3 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  activityId?: number;

  @ApiPropertyOptional({ enum: Object.values(ActivityReservationStatus) })
  @IsOptional() @IsIn(Object.values(ActivityReservationStatus))
  status?: ActivityReservationStatus;

  @ApiPropertyOptional({ description: 'Buscar por nombre/email/phone' })
  @IsOptional() @IsString()
  q?: string;

  @ApiPropertyOptional({ example: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  limit?: number;
}
