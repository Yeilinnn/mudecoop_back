import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('chatbot_message')
export class ChatbotMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 30 })
  kind: string; // ejemplo: 'saludo', 'fallback', 'despedida', etc.

  @Column('text')
  content: string;

  @Column({ name: 'is_active', type: 'tinyint', default: 1 })
  isActive: boolean;

  @Column({ name: 'display_order', type: 'int', default: 1 })
  displayOrder: number;
}
