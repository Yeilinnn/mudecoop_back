import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class FilterContactDto {
  @ApiPropertyOptional({
    description: 'Filtrar por tipo (string libre), p.ej. "phone", "instagram", "whatsapp"',
    example: 'instagram',
  })
  @IsOptional()
  @IsString()
  @Length(1, 20)
  kind?: string;

  @ApiPropertyOptional({
    description: 'Solo activos/inactivos',
    oneOf: [
      { type: 'boolean' },
      { type: 'string', enum: ['true', 'false', '1', '0', 'yes', 'no', 'on', 'off'] },
      { type: 'number', enum: [0, 1] },
    ],
    example: true,
  })
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
  active?: boolean;
}
