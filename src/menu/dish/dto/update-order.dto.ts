import { IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateOrderDto {
  @Type(() => Number)
  @IsInt()
  displayOrder!: number;
}