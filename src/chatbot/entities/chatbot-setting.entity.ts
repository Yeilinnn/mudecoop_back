import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('chatbot_setting')
export class ChatbotSetting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'is_enabled', type: 'tinyint', default: 0 })
  isEnabled: boolean;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
