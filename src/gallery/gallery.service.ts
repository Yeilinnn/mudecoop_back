import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { StorageService } from '../common/storage/storage.service';
import { Express } from 'express';

import { Gallery } from './entities/gallery.entity';
import { GalleryImage } from './entities/gallery-image.entity';

import { CreateGalleryDto } from './dto/create-gallery.dto';
import { UpdateGalleryDto } from './dto/update-gallery.dto';
import { FilterGalleryDto } from './dto/filter-gallery.dto';
import { CreateImageDto } from './dto/create-image.dto';

@Injectable()
export class GalleryService {
  constructor(
    @InjectRepository(Gallery) private readonly galRepo: Repository<Gallery>,
    @InjectRepository(GalleryImage) private readonly imgRepo: Repository<GalleryImage>,
    private readonly storage: StorageService,
  ) {}

  // ===== GALLERIES =====
  async createGallery(dto: CreateGalleryDto) {
    const entity = this.galRepo.create({
      title: dto.title.trim(),
      description: dto.description?.trim() ?? null,
      layout: dto.layout,
      isActive: !!dto.isActive,
    });
    return this.galRepo.save(entity);
  }

  async listGalleries(q: FilterGalleryDto) {
    const where: FindOptionsWhere<Gallery> = {};
    if (typeof q.active === 'boolean') where.isActive = q.active;
    return this.galRepo.find({ where, order: { id: 'ASC' } });
  }

  async getGalleryWithImages(id: number) {
    const gal = await this.galRepo.findOne({ where: { id } });
    if (!gal) throw new NotFoundException('Galería no encontrada');
    const images = await this.imgRepo.find({
      where: { galleryId: id },
      order: { displayOrder: 'ASC', id: 'ASC' },
      select: ['id', 'galleryId', 'filePath', 'displayOrder', 'isVisible'],
    });
    return { ...gal, images };
  }

  async updateGallery(id: number, dto: UpdateGalleryDto) {
    const gal = await this.galRepo.findOne({ where: { id } });
    if (!gal) throw new NotFoundException('Galería no encontrada');
    Object.assign(gal, {
      title: dto.title?.trim() ?? gal.title,
      description: dto.description?.trim() ?? gal.description,
      layout: dto.layout ?? gal.layout,
      isActive: typeof dto.isActive === 'boolean' ? dto.isActive : gal.isActive,
    });
    return this.galRepo.save(gal);
  }

  async updateGalleryVisibility(id: number, isActive: boolean) {
    const gal = await this.galRepo.findOne({ where: { id } });
    if (!gal) throw new NotFoundException('Galería no encontrada');
    gal.isActive = !!isActive;
    return this.galRepo.save(gal);
  }

  async removeGallery(id: number) {
    const gal = await this.galRepo.findOne({ where: { id } });
    if (!gal) return { ok: true };

    const images = await this.imgRepo.find({ where: { galleryId: id } });
    await Promise.all(images.map((img) => this.storage.removeByPublicPath(img.filePath)));

    await this.imgRepo.delete({ galleryId: id });
    await this.galRepo.delete(id);
    return { ok: true };
  }

  // ===== IMAGES =====
  async addImage(galleryId: number, file: Express.Multer.File, body: CreateImageDto) {
    const gal = await this.galRepo.findOne({ where: { id: galleryId } });
    if (!gal) throw new NotFoundException('Galería no encontrada');
    if (!file) throw new BadRequestException('Archivo requerido');

    const { publicPath } = await this.storage.save(file.buffer, file.originalname, 'gallery');

    // displayOrder por defecto: max+1
    let order = body.displayOrder;
    if (!order) {
      const row = await this.imgRepo
        .createQueryBuilder('i')
        .select('COALESCE(MAX(i.displayOrder), 0)', 'max')
        .where('i.galleryId = :galleryId', { galleryId })
        .getRawOne<{ max: string | number }>();
      order = row ? Number(row.max) + 1 : 1;
    }

    const entity = this.imgRepo.create({
      galleryId,
      filePath: publicPath,
      displayOrder: order,
      isVisible: body.isVisible ?? true,
    });
    return this.imgRepo.save(entity);
  }

  async listImages(galleryId: number) {
    return this.imgRepo.find({
      where: { galleryId },
      order: { displayOrder: 'ASC', id: 'ASC' },
      select: ['id', 'galleryId', 'filePath', 'displayOrder', 'isVisible'],
    });
  }

  async updateImageOrder(imageId: number, displayOrder: number) {
    if (!Number.isInteger(displayOrder) || displayOrder < 1) {
      throw new BadRequestException('displayOrder debe ser entero >= 1');
    }
    const img = await this.imgRepo.findOne({ where: { id: imageId } });
    if (!img) throw new NotFoundException('Imagen no encontrada');
    img.displayOrder = displayOrder;
    return this.imgRepo.save(img);
  }

  // ✅ NECESARIO para el front (toggle)
  async updateImageVisibility(imageId: number, isVisible: boolean) {
    const img = await this.imgRepo.findOne({ where: { id: imageId } });
    if (!img) throw new NotFoundException('Imagen no encontrada');
    img.isVisible = !!isVisible;
    return this.imgRepo.save(img);
  }

  async removeImage(imageId: number) {
    const img = await this.imgRepo.findOne({ where: { id: imageId } });
    if (!img) return { ok: true };
    await this.storage.removeByPublicPath(img.filePath);
    await this.imgRepo.delete(imageId);
    return { ok: true };
  }

  // ===== PUBLIC =====
  async getPublicGallery(id: number) {
    const gal = await this.galRepo.findOne({ where: { id, isActive: true } });
    if (!gal) throw new NotFoundException('Galería no encontrada o inactiva');
    const images = await this.imgRepo.find({
      where: { galleryId: id, isVisible: true },
      order: { displayOrder: 'ASC', id: 'ASC' },
      select: ['id', 'galleryId', 'filePath', 'displayOrder', 'isVisible'],
    });
    return { ...gal, images };
  }
}
