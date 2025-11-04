import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, JoinColumn } from 'typeorm';
import { CoopActivity } from './coop-activity.entity';

@Entity('coop_activity_block')
export class CoopActivityBlock {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => CoopActivity, (activity) => activity.blocks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'coop_activity_id' }) // 👈 nombre real en la base
  activity: CoopActivity;

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
