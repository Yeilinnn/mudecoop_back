import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
} from 'typeorm';
import { CoopActivityBlock } from './coop-activity-block.entity';
import { ActivityReservation } from '../../activity-reservation/entities/activity-reservation.entity';
import { ActivityContact } from '../activity-contact/activity-contact.entity'; // ✅ agregado

@Entity('coop_activity')
export class CoopActivity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  include_text?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  instructions_text?: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image_path?: string | null;

  @Column({ type: 'tinyint', default: 1 })
  is_active: number;

  @Column({ type: 'datetime', nullable: true })
  start_at?: Date | null;

  @Column({ type: 'datetime', nullable: true })
  end_at?: Date | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  location?: string | null;

  @Column({ type: 'int', nullable: true })
  capacity?: number | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;

  // 🔹 Relación con bloques
  @OneToMany(() => CoopActivityBlock, (b) => b.activity, { cascade: true })
  blocks: CoopActivityBlock[];

  // 🔹 Relación con reservas
  @OneToMany(() => ActivityReservation, (r) => r.activity, { cascade: true })
  reservations: ActivityReservation[];

  // 🔹 Relación con contactos (💬 NUEVO)
  @OneToMany(() => ActivityContact, (contact) => contact.activity, { cascade: true })
  contacts: ActivityContact[];
}
