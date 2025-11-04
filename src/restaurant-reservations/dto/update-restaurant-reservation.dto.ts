import { PartialType } from '@nestjs/mapped-types';
import { CreateRestaurantReservationDto } from './create-restaurant-reservation.dto';

export class UpdateRestaurantReservationDto extends PartialType(CreateRestaurantReservationDto) {}
