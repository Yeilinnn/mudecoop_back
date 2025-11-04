import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, JoinColumn } from 'typeorm';
import { CoopActivity } from '../../activities/coop-activity/coop-activity.entity';

@Entity('activity_reservation')
export class ActivityReservation {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => CoopActivity, (activity) => activity.reservations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'coop_activity_id' }) 
  activity: CoopActivity;

  @Column({ type: 'varchar', length: 160 })
  full_name: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  phone?: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  email?: string | null;

  @Column({ type: 'int', default: 1 })
  people_count: number;

  @Column({ type: 'text', nullable: true })
  note?: string | null;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  confirmed_by?: string | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;
}
