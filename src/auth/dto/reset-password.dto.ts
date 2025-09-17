import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'd6a7c1b6e2d84b4b8b2a... (token recibido por correo)',
    description: 'Token plano recibido en el enlace del correo',
  })
  @IsString()
  token!: string;

  @ApiProperty({ example: 'NuevoPass#2025' })
  @IsString()
  @MinLength(8)
  password!: string;
}
