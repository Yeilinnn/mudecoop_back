import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class UpdateOrderDto {
  @ApiProperty({ description: 'Posición (>=1)', example: 3 })
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  displayOrder!: number;
}
