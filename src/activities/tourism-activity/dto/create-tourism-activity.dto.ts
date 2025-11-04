import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTourismActivityDto {
  @ApiProperty({ description: 'Título de la actividad turística' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Descripción de la actividad turística' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Información del horario o programación' })
  @IsOptional()
  @IsString()
  include_schedule_text?: string;

  @ApiPropertyOptional({ description: 'Teléfono de contacto' })
  @IsOptional()
  @IsString()
  contact_phone?: string;

  @ApiPropertyOptional({ description: 'Correo de contacto' })
  @IsOptional()
  @IsString()
  contact_email?: string;

  @ApiPropertyOptional({ description: 'Notas o indicaciones para el contacto' })
  @IsOptional()
  @IsString()
  contact_note?: string;

  @ApiPropertyOptional({ description: 'URL de la imagen principal' })
  @IsOptional()
  @IsString()
  image_path?: string;

  @ApiPropertyOptional({ description: 'Fecha y hora de inicio' })
  @IsOptional()
  @IsString()
  start_at?: string;

  @ApiPropertyOptional({ description: 'Fecha y hora de finalización' })
  @IsOptional()
  @IsString()
  end_at?: string;

  @ApiPropertyOptional({ description: 'Ubicación o dirección' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Capacidad máxima de personas' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  capacity?: number;

  @ApiPropertyOptional({ description: 'Estado de la actividad (1 activa, 0 inactiva)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  is_active?: number;
}
