import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateSectionDto {
  @ApiProperty({
    example: 'historia',
    description: 'Clave única de la sección (URL key). Letras/números/guiones/underscore.',
    maxLength: 80,
  })
  @IsString()
  @Length(1, 80)
  @Matches(/^[a-zA-Z0-9_\-]+$/, { message: 'Sólo letras, números, guiones y guiones bajos' })
  sectionKey!: string;

  @ApiPropertyOptional({
    example: 'Historia de Mudecoop',
    description: 'Título visible del panel',
    maxLength: 160,
  })
  @IsOptional()
  @IsString()
  @Length(0, 160)
  panelTitle?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Visible en público',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}
