// src/notifications/entities/notification.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RestaurantReservation } from 'src/restaurant-reservations/entities/restaurant-reservation.entity';
import { ActivityReservation } from 'src/activity-reservation/entities/activity-reservation.entity';
import { User } from 'src/auth/entities/user.entity';

@Entity('notification')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 20 })
  category: string; // e.g. 'RESERVATION', 'CONTACT', 'SYSTEM'

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ length: 20, default: 'new' })
  status: string; // 'new', 'read', etc.

  @Column({
    type: 'enum',
    enum: ['EMAIL', 'PUSH', 'SYSTEM'],
    default: 'SYSTEM',
  })
  type: 'EMAIL' | 'PUSH' | 'SYSTEM';

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User | null;

  @ManyToOne(() => RestaurantReservation, { nullable: true })
  @JoinColumn({ name: 'restaurant_reservation_id' })
  restaurantReservation?: RestaurantReservation | null;

  @ManyToOne(() => ActivityReservation, { nullable: true })
  @JoinColumn({ name: 'activity_reservation_id' })
  activityReservation?: ActivityReservation | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
