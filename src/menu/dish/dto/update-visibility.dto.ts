import { IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateVisibilityDto {
  @Type(() => Boolean)
  @IsBoolean()
  isActive!: boolean;
}