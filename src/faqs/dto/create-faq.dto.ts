import { IsString, IsBoolean, IsOptional, IsInt, MinLength, IsArray } from 'class-validator';

export class CreateFaqDto {
  @IsString()
  @MinLength(3)
  question: string;

  @IsString()
  @MinLength(3)
  answer: string;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @IsOptional()
  @IsInt()
  displayOrder?: number;
}
