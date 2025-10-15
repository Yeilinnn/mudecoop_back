import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

function toBool(value: unknown): unknown {
  if (value === undefined || value === null || value === '') return undefined;
  if (value === true || value === false) return value;
  const v = String(value).toLowerCase().trim();
  if (['true', '1', 'yes', 'on'].includes(v)) return true;
  if (['false', '0', 'no', 'off'].includes(v)) return false;
  return value;
}

export class CreateGalleryDto {
  @ApiProperty({ example: 'Galería principal', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  title!: string;

  @ApiProperty({ example: 'Imágenes destacadas', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ['carousel', 'grid', 'mosaic'], default: 'grid', required: false })
  @IsOptional()
  @IsIn(['carousel', 'grid', 'mosaic'])
  layout?: 'carousel' | 'grid' | 'mosaic';

  @ApiProperty({ example: true, required: false, default: true })
  @IsOptional()
  @Transform(({ value }) => toBool(value), { toClassOnly: true })
  @IsBoolean()
  isActive?: boolean;
}
