import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsDateString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCoopActivityDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  include_text?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instructions_text?: string;

  @ApiPropertyOptional({ description: 'URL de imagen (se llenará al subirla)', nullable: true })
  @IsOptional()
  @IsString()
  image_path?: string | null;

  // NUEVOS CAMPOS (coinciden con DB)
  @ApiPropertyOptional({ type: String, description: 'Inicio ISO, ej: 2025-11-05T09:00:00' })
  @IsOptional()
  @IsDateString()
  start_at?: string;

  @ApiPropertyOptional({ type: String, description: 'Fin ISO, ej: 2025-11-05T13:00:00' })
  @IsOptional()
  @IsDateString()
  end_at?: string;

  @ApiPropertyOptional({ description: 'Lugar' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Cupo' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  capacity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  is_active?: number;
}
