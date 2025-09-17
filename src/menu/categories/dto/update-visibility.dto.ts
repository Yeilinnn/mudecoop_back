import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean } from 'class-validator';

export class UpdateVisibilityDto {
  @ApiProperty({
    description: 'Activa o inactiva la categoría',
    oneOf: [
      { type: 'boolean' },
      { type: 'string', enum: ['true', 'false', '1', '0', 'yes', 'no', 'on', 'off'] },
      { type: 'number', enum: [0, 1] },
    ],
    example: true,
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
