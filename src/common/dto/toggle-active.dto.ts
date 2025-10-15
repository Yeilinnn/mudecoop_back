// src/common/dto/toggle-active.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class ToggleActiveDto {
  @ApiProperty({
    description: 'Activa/Inactiva el recurso',
    example: true,
    oneOf: [
      { type: 'boolean' },
      { type: 'string', enum: ['true', 'false', '1', '0', 'yes', 'no', 'on', 'off'] },
      { type: 'number', enum: [0, 1] },
    ],
  })
  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
      const v = value.trim().toLowerCase();
      return v === 'true' || v === '1' || v === 'yes' || v === 'on';
    }
    return false;
  })
  @IsBoolean()
  isActive!: boolean;
}
