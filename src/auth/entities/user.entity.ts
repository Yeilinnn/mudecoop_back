// src/auth/entities/user.entity.ts
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Role } from './roles.entity';
import { Exclude } from 'class-transformer';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'first_name', type: 'varchar', length: 120, nullable: true })
  firstName: string | null;

  @Column({ name: 'last_name', type: 'varchar', length: 120, nullable: true })
  lastName: string | null;

  @Column({ name: 'second_last_name', type: 'varchar', length: 120, nullable: true })
  secondLastName: string | null;

  @Column({ name: 'email', type: 'varchar', length: 150, unique: true })
  email: string;

  // 🔒 No se carga por defecto y tampoco se serializa si llegara a cargarse
  @Exclude()
  @Column({ name: 'password', type: 'varchar', length: 255, select: false })
  password: string;

  @Column({ name: 'status', type: 'varchar', length: 20, default: 'active' })
  status: 'active' | 'inactive';

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @ManyToOne(() => Role, (r) => r.users, { eager: true })
  @JoinColumn({ name: 'role_id' })
  role: Role;
}
