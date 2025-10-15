// src/contact/dto/update-contact.dto.ts
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { CONTACT_KINDS, ContactKind } from '../contact.kinds';

export class UpdateContactDto {
  @IsOptional()
  @IsEnum(CONTACT_KINDS, { message: `kind must be one of: ${CONTACT_KINDS.join(', ')}` })
  kind?: ContactKind;

  @IsOptional()
  @IsString() @MaxLength(255)
  value?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null || value === undefined ? undefined : Number(value)))
  @IsInt() @Min(1)
  displayOrder?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
      const v = value.trim().toLowerCase();
      return v === 'true' || v === '1' || v === 'on' || v === 'yes';
    }
    return false;
  })
  @IsBoolean()
  isActive?: boolean;
}
