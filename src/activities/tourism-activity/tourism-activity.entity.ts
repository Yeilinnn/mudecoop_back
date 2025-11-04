import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TourismActivityBlock } from './tourism-activity-block.entity';

@Entity('tourism_activity')
export class TourismActivity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  include_schedule_text?: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  contact_phone?: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  contact_email?: string;

  @Column({ type: 'text', nullable: true })
  contact_note?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  image_path?: string;

  @Column({ type: 'tinyint', default: 1 })
  is_active: number;

  @Column({ type: 'datetime', nullable: true })
  start_at?: Date;

  @Column({ type: 'datetime', nullable: true })
  end_at?: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location?: string;

  @Column({ type: 'int', nullable: true })
  capacity?: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;

  @OneToMany(() => TourismActivityBlock, (block) => block.activity, {
    cascade: true,
  })
  blocks: TourismActivityBlock[];
}
