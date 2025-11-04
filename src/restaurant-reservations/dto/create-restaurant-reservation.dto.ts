import { IsString, IsEmail, IsOptional, IsInt, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRestaurantReservationDto {
  @IsString()
  customerName: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsDateString()
  date: string;

  @IsString()
  time: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  peopleCount: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  zone?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  tableNumber?: number;

  @IsOptional()
  @IsString()
  status?: string;
}
