import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity'; // ajusta la ruta si tu módulo users está en otra ubicación

@Entity('restaurant_reservation')
export class RestaurantReservation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'customer_name' })
  customerName: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'time' })
  time: string;

  @Column({ name: 'people_count', type: 'int', default: 2 })
  peopleCount: number;

  @Column({ nullable: true, type: 'text' })
  note: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ name: 'confirmed_by', nullable: true })
  confirmedBy?: number;

  @Column({ nullable: true })
  zone?: string;

  @Column({ name: 'table_number', nullable: true })
  tableNumber?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relación con usuario que confirma
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'confirmed_by' })
  confirmedUser?: User;
}
