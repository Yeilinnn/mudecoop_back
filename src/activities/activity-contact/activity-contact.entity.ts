import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { CoopActivity } from '../coop-activity/coop-activity.entity';

@Entity('activity_contact')
export class ActivityContact {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => CoopActivity, (activity) => activity.contacts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'coop_activity_id' })
  activity: CoopActivity;

  @Column({ type: 'varchar', length: 160 })
  full_name: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  email?: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  phone?: string | null;

  @Column({ type: 'text', nullable: true })
  message?: string | null;

  @CreateDateColumn()
  created_at: Date;
}
