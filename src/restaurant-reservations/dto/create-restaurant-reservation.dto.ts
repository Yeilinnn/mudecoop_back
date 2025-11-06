import { 
  IsString, 
  IsEmail, 
  IsOptional, 
  IsInt, 
  Min, 
  Max,
  IsDateString,
  Matches,
  IsNotEmpty,
  MinLength,
  MaxLength,
  ValidateIf
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRestaurantReservationDto {
  @ApiProperty({ description: 'Nombre completo del cliente', example: 'Juan Pérez' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre del cliente es requerido' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  @Transform(({ value }) => value?.trim())
  customerName: string;

  @ApiPropertyOptional({ description: 'Teléfono del cliente', example: '+506 8888-8888' })
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'El teléfono debe tener al menos 8 dígitos' })
  @MaxLength(20, { message: 'El teléfono no puede exceder 20 caracteres' })
  @Transform(({ value }) => value?.trim())
  phone?: string;

  @ApiPropertyOptional({ description: 'Correo electrónico del cliente', example: 'cliente@example.com' })
  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @Transform(({ value }) => value?.trim().toLowerCase())
  email?: string;

  @ApiProperty({ description: 'Fecha de la reserva (YYYY-MM-DD)', example: '2025-11-10' })
  @IsDateString({}, { message: 'La fecha debe estar en formato YYYY-MM-DD' })
  @IsNotEmpty({ message: 'La fecha es requerida' })
  date: string;

  @ApiProperty({ description: 'Hora de la reserva (HH:mm formato 24h)', example: '14:30' })
  @IsString()
  @IsNotEmpty({ message: 'La hora es requerida' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'La hora debe estar en formato HH:mm (24 horas)',
  })
  time: string;

  @ApiProperty({ description: 'Cantidad de personas (1-30)', example: 4, minimum: 1, maximum: 30 })
  @IsInt({ message: 'La cantidad de personas debe ser un número entero' })
  @Min(1, { message: 'Debe haber al menos 1 persona' })
  @Max(30, { message: 'La capacidad máxima por reserva es de 30 personas' })
  @Type(() => Number)
  peopleCount: number;

  @ApiPropertyOptional({ description: 'Notas o comentarios adicionales', example: 'Celebración de cumpleaños' })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Las notas no pueden exceder 500 caracteres' })
  @Transform(({ value }) => value?.trim())
  note?: string;

  @ApiPropertyOptional({ description: 'Zona del restaurante', example: 'Terraza' })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'La zona no puede exceder 50 caracteres' })
  @Transform(({ value }) => value?.trim())
  zone?: string;

  @ApiPropertyOptional({ description: 'Número de mesa asignada', example: 5 })
  @IsOptional()
  @IsInt({ message: 'El número de mesa debe ser un número entero' })
  @Min(1, { message: 'El número de mesa debe ser mayor a 0' })
  @Type(() => Number)
  tableNumber?: number;

  @ApiPropertyOptional({ description: 'Estado de la reserva', example: 'pending', enum: ['pending', 'confirmed', 'cancelled'] })
  @IsOptional()
  @IsString()
  @Matches(/^(pending|confirmed|cancelled)$/, {
    message: 'El estado debe ser: pending, confirmed o cancelled',
  })
  status?: string;
}