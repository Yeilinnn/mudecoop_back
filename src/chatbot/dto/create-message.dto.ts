import { IsString, IsBoolean, IsInt, IsOptional, MaxLength } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @MaxLength(30)
  kind: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @IsOptional()
  @IsInt()
  displayOrder?: number = 1;
}
