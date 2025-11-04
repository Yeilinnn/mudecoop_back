import { IsNotEmpty, IsIn, IsInt } from 'class-validator';

export class ChangeStatusRestaurantDto {
  @IsNotEmpty()
  @IsIn(['pending', 'confirmed', 'cancelled'])
  status: string;

  @IsInt()
  confirmedBy: number;
}
