import { IsNotEmpty, MinLength, Matches, MaxLength } from 'class-validator';

export class UpdatePasswordDto {
  @IsNotEmpty()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(64, { message: 'La contraseña no debe exceder 64 caracteres' })
  @Matches(/^(?=.*[A-Z])(?=.*\d).+$/, { message: 'La contraseña debe tener al menos una mayúscula y un número' })
  password: string;
}
