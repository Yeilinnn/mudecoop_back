import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, JoinColumn } from 'typeorm';
import { TourismActivity } from './tourism-activity.entity';

@Entity('tourism_activity_block')
export class TourismActivityBlock {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => TourismActivity, (activity) => activity.blocks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tourism_activity_id' }) // 👈 importante: este nombre debe coincidir con tu base
  activity: TourismActivity;

  @Column({ type: 'varchar', length: 200, nullable: true })
  title?: string | null;

  @Column({ type: 'text', nullable: true })
  body?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  image_path?: string | null;

  @Column({ type: 'int', default: 1 })
  display_order: number;

  @Column({ type: 'tinyint', default: 1 })
  is_active: number;
}
