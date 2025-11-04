import { IsString, IsOptional, IsEmail, IsInt, Min } from 'class-validator';

export class CreateActivityReservationDto {
  @IsString()
  full_name: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  people_count?: number;

  @IsOptional()
  @IsString()
  note?: string;
}
