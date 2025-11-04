import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsNumber,
  IsUrl,
  IsEmail,
} from 'class-validator';

export class CreateNotificationDto {
  @ApiProperty({ example: 'RESERVATION' })
  @IsString()
  category: string;

  @ApiProperty({ example: 'Nueva reserva creada' })
  @IsString()
  title: string;

  @ApiProperty({
    example: 'Reserva creada por Yeilin Moya para el 2025-11-02',
  })
  @IsString()
  message: string;

  @ApiProperty({ enum: ['EMAIL', 'PUSH', 'SYSTEM'], required: false })
  @IsEnum(['EMAIL', 'PUSH', 'SYSTEM'])
  @IsOptional()
  type?: 'EMAIL' | 'PUSH' | 'SYSTEM';

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  restaurant_reservation_id?: number;

  @ApiProperty({ example: 2, required: false })
  @IsOptional()
  @IsNumber()
  activity_reservation_id?: number;

  @ApiProperty({ example: 5, required: false })
  @IsOptional()
  @IsNumber()
  user_id?: number;

  // 🔗 URL opcional al detalle de la reserva
  @ApiPropertyOptional({
    example: 'https://admin.mudecoop.cr/reservas/1',
    description: 'Enlace directo al detalle de la reserva (opcional)',
  })
  @IsOptional()
  @IsUrl()
  reservation_url?: string;

  // ✅ NUEVO: permite enviar correos directos sin user_id
  @ApiPropertyOptional({
    example: 'cliente@mudecoop.cr',
    description:
      'Correo electrónico directo del destinatario (sin necesidad de user_id)',
  })
  @IsOptional()
  @IsEmail()
  toEmail?: string;
}
