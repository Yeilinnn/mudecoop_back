import { IsNotEmpty, IsString, MaxLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateRoleDto {
  @IsNotEmpty({ message: 'El nombre del rol es obligatorio' })
  @IsString()
  @MaxLength(50, { message: 'El nombre del rol no debe exceder 50 caracteres' })
  @Matches(/^[A-Z0-9_]+$/, { message: 'Use MAYÚSCULAS, números y guión bajo (ej: ADMIN, EDITOR)' })
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'string') return value.trim().toUpperCase();
    return value as string;
  })
  name: string;
}
