// src/auth/entities/role.entity.ts
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'name', type: 'varchar', length: 50 })
  name: string; // ADMIN | EDITOR

  @OneToMany(() => User, (u) => u.role)
  users: User[];
}
