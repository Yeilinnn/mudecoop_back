import { IsInt } from 'class-validator';

export class UpdateRoleDto {
  @IsInt({ message: 'roleId debe ser numérico' })
  roleId: number;
}
