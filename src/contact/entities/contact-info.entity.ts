import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('contact_info')
export class ContactInfo {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 20 })
  kind!: string; // address | phone | email | facebook | instagram | tiktok

  @Column({ type: 'varchar', length: 100, nullable: true })
  title!: string | null;

  @Column({ type: 'varchar', length: 255 })
  value!: string;

  @Column({ name: 'display_order', type: 'int', default: 1 })
  displayOrder!: number;

  @Column({ name: 'is_active', type: 'tinyint', width: 1, default: 1 })
  isActive!: boolean;
}
