import { IsEmail, IsOptional, MaxLength, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateUserDto {
  @IsOptional() @IsString() @MaxLength(120)
  firstName?: string;

  @IsOptional() @IsString() @MaxLength(120)
  lastName?: string;

  @IsOptional() @IsString() @MaxLength(120)
  secondLastName?: string;

  @IsOptional() @IsEmail({}, { message: 'Debe ser un correo válido' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email?: string;
}
