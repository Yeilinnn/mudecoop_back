import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Gallery } from './gallery.entity';

@Entity({ name: 'gallery_image' })
@Index('ix_img_gallery', ['galleryId', 'displayOrder'])
export class GalleryImage {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'gallery_id', type: 'int' })
  galleryId!: number;

  @ManyToOne(() => Gallery, (g) => g.images, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'gallery_id' })
  gallery!: Gallery;

  @Column({ type: 'varchar', length: 100, nullable: true })
  title!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'file_path', type: 'varchar', length: 255 })
  filePath!: string;

  @Column({ name: 'alt_text', type: 'varchar', length: 150, nullable: true })
  altText!: string | null;

  @Column({ name: 'display_order', type: 'int', default: () => '1' })
  displayOrder!: number;

  @Column({
    name: 'is_visible',
    type: 'tinyint',
    width: 1,
    default: () => '1',
    transformer: {
      to: (v: boolean) => (v ? 1 : 0),
      from: (v: unknown) => !!v,
    },
  })
  isVisible!: boolean;
}
