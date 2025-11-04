import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateActivityContactDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(160)
  @ApiProperty({
    example: 'María López',
    description: 'Nombre completo de la persona que llena el formulario',
  })
  full_name: string;

  @IsOptional()
  @IsEmail()
  @ApiPropertyOptional({
    example: 'maria.lopez@example.com',
    description: 'Correo electrónico del contacto (opcional)',
  })
  email?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    example: '8888-9999',
    description: 'Teléfono del contacto (opcional)',
  })
  phone?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    example: 'Me gustaría participar en la próxima actividad.',
    description: 'Mensaje enviado desde el formulario (opcional)',
  })
  message?: string;

  
}
