import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RestaurantReservationsService } from './restaurant-reservations.service';
import { RestaurantReservationsController } from './restaurant-reservations.controller';
import { RestaurantReservation } from './entities/restaurant-reservation.entity';
import { NotificationsModule } from '../notifications/notifications.module'; // ✅ IMPORTAR

@Module({
  imports: [
    TypeOrmModule.forFeature([RestaurantReservation]),
    NotificationsModule, // ✅ AGREGAR ESTO
  ],
  controllers: [RestaurantReservationsController],
  providers: [RestaurantReservationsService],
  exports: [RestaurantReservationsService],
})
export class RestaurantReservationsModule {}