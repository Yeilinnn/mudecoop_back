import { IsEmail, IsNotEmpty, MinLength, Matches, MaxLength, IsOptional, IsString, IsInt, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @IsNotEmpty() @IsString() @MaxLength(120)
  firstName: string;

  @IsNotEmpty() @IsString() @MaxLength(120)
  lastName: string;

  @IsOptional() @IsString() @MaxLength(120)
  secondLastName?: string;

  @IsEmail({}, { message: 'Debe ser un correo válido' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email: string;

  @IsNotEmpty()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(64, { message: 'La contraseña no debe exceder 64 caracteres' })
  @Matches(/^(?=.*[A-Z])(?=.*\d).+$/, { message: 'La contraseña debe tener al menos una mayúscula y un número' })
  password: string;

  @IsInt({ message: 'roleId debe ser numérico' })
  roleId: number;

  @IsOptional() @IsIn(['active', 'inactive'])
  status?: 'active' | 'inactive';
}
