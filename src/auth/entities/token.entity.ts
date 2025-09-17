import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('tokens')
@Index('ix_tokens_user', ['userId'])
@Index('ux_tokens_token', ['token'], { unique: true })
export class Token {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @Column({ type: 'varchar', length: 255 })
  token: string;

  @Column({ name: 'expires_at', type: 'datetime' })
  expiresAt: Date;

  @Column({ name: 'used_at', type: 'datetime', nullable: true })
  usedAt: Date | null;
}
