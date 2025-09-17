import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

const toBool = (v: any) => ['true','1','yes','on',true,1].includes(
  typeof v === 'string' ? v.toLowerCase() : v
);

export class CreateCategoryDto {
  @ApiProperty({ example: 'Bebidas' })
  @IsString() @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'Refrescos y cocteles', required: false })
  @IsOptional() @IsString()
  description?: string;

  @ApiProperty({ example: 1, minimum: 1, default: 1, required: false })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  displayOrder: number = 1;

  @ApiProperty({ example: true, default: true, required: false })
  @IsOptional() @Transform(({value}) => toBool(value)) @IsBoolean()
  isActive: boolean = true;
}
