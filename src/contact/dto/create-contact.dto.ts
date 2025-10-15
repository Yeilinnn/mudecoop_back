// src/contact/dto/create-contact.dto.ts
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { CONTACT_KINDS, ContactKind } from '../contact.kinds';

export class CreateContactDto {
  @IsEnum(CONTACT_KINDS, { message: `kind must be one of: ${CONTACT_KINDS.join(', ')}` })
  kind!: ContactKind;

  @IsString() @MaxLength(255)
  value!: string;

  @Transform(({ value }) => Number(value))
  @IsInt() @Min(1)
  displayOrder!: number;

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
  isActive!: boolean;
}
