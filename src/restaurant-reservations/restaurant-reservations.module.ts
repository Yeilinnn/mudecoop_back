import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RestaurantReservationsService } from './restaurant-reservations.service';
import { RestaurantReservationsController } from './restaurant-reservations.controller';
import { RestaurantReservation } from './entities/restaurant-reservation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RestaurantReservation])],
  controllers: [RestaurantReservationsController],
  providers: [RestaurantReservationsService],
  exports: [RestaurantReservationsService],
})
export class RestaurantReservationsModule {}
