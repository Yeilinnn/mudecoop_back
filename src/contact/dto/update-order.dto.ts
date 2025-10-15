import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UpdateContactOrderDto {
  @ApiProperty({ description: 'Nuevo orden (>=1)', example: 2, minimum: 1 })
  @IsInt()
  @Min(1)
  displayOrder!: number;
}
