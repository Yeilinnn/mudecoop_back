import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { GalleryImage } from './gallery-image.entity';

@Entity({ name: 'gallery' })
export class Gallery {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 50 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 20, default: 'grid' })
  layout!: 'carousel' | 'grid' | 'mosaic';

  @Column({
    name: 'is_active',
    type: 'tinyint',
    width: 1,
    default: () => '1',
    transformer: {
      to: (v: boolean) => (v ? 1 : 0),
      from: (v: unknown) => !!v,
    },
  })
  isActive!: boolean;

  @OneToMany(() => GalleryImage, (img) => img.gallery)
  images?: GalleryImage[];
}
