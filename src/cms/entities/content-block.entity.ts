import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { PageSection } from './page-section.entity';

@Entity({ name: 'content_block' })
@Index('ix_block_section', ['sectionId', 'displayOrder'])
export class ContentBlock {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'section_id', type: 'int' })
  sectionId!: number;

  // 🔧 Enlazamos la relación a la columna correcta de la tabla (section_id)
  @ManyToOne(() => PageSection, (s) => s.blocks, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'section_id' })
  section!: PageSection;

  @Column({ type: 'varchar', length: 200, nullable: true })
  title!: string | null;

  @Column({ type: 'text', nullable: true })
  body!: string | null;

  @Column({ name: 'image_path', type: 'varchar', length: 255, nullable: true })
  imagePath!: string | null;

  // (Opcionales en DB; los dejo mapeados por si en el futuro los usas)
  @Column({ name: 'button_text', type: 'varchar', length: 100, nullable: true })
  buttonText!: string | null;

  @Column({ name: 'button_url', type: 'varchar', length: 255, nullable: true })
  buttonUrl!: string | null;

  @Column({ name: 'display_order', type: 'int', default: () => '1' })
  displayOrder!: number;

  // tinyint(1) → boolean
  @Column({ name: 'is_active', type: 'tinyint', width: 1, default: () => '1' })
  isActive!: boolean;
}
