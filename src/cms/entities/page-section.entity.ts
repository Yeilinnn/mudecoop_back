import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ContentBlock } from './content-block.entity';

@Entity({ name: 'page_section' })
export class PageSection {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'section_key', type: 'varchar', length: 80, unique: true })
  sectionKey!: string;

  @Column({ name: 'panel_title', type: 'varchar', length: 160, nullable: true })
  panelTitle!: string | null;

  // tinyint(1) en MySQL mapeado a boolean
  @Column({ name: 'is_visible', type: 'tinyint', width: 1, default: () => '1' })
  isVisible!: boolean;

  // No forcemos cascade aquí; la DB ya tiene ON DELETE CASCADE en la FK
  @OneToMany(() => ContentBlock, (b) => b.section)
  blocks!: ContentBlock[];
}
