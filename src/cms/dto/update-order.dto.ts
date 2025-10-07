// src/cms/dto/update-order.dto.ts
import { IsInt, Min } from 'class-validator';
export class UpdateOrderDto {
  @IsInt()
  @Min(1)
  displayOrder: number;
}
