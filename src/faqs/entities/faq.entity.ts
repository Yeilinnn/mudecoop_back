import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('faq')
export class Faq {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  question: string;

  @Column({ type: 'text' })
  answer: string;

  // 👇 Nueva columna JSON para las etiquetas de búsqueda
  @Column({ type: 'json', nullable: true })
  tags?: string[] | null;

  @Column({ name: 'is_visible', type: 'tinyint', default: 1 })
  isVisible: boolean;

  @Column({ name: 'display_order', type: 'int', default: 1 })
  displayOrder: number;
}
