// src/contact/dto/list-contact.query.ts
import { IsBooleanString, IsEnum, IsOptional } from 'class-validator';
import { CONTACT_KINDS, ContactKind } from '../contact.kinds';

export class ListContactQuery {
  @IsOptional()
  @IsEnum(CONTACT_KINDS, { message: `kind must be one of: ${CONTACT_KINDS.join(', ')}` })
  kind?: ContactKind;

  @IsOptional()
  @IsBooleanString()
  active?: 'true' | 'false';
}
