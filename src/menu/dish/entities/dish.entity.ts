import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('dish') // cambia si tu tabla tiene otro nombre
export class Dish {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'category_id', type: 'int' })
  categoryId!: number;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  // Guardamos DECIMAL como string para no perder precisión en JS
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price!: string;

  @Column({ name: 'display_order', type: 'int', default: 1 })
  displayOrder!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
