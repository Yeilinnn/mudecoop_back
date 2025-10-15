import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as fs from 'fs/promises';
import * as fssync from 'fs';
import * as path from 'path';

import { PageSection } from './entities/page-section.entity';
import { ContentBlock } from './entities/content-block.entity';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { CreateBlockDto } from './dto/create-block.dto';
import { UpdateBlockDto } from './dto/update-block.dto';

@Injectable()
export class CmsService {
  private readonly uploadsRoot = path.resolve(process.cwd(), 'uploads', 'sections');

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(PageSection) private readonly sectionRepo: Repository<PageSection>,
    @InjectRepository(ContentBlock) private readonly blockRepo: Repository<ContentBlock>,
  ) {}

  // ===== helpers de archivos =====
  private async ensureRoot() {
    await fs.mkdir(this.uploadsRoot, { recursive: true });
  }

  private async saveImage(file: Express.Multer.File): Promise<string> {
    if (!file) throw new BadRequestException('No se recibió archivo');
    if (!(file.buffer && file.buffer.length)) {
      throw new BadRequestException('Archivo inválido (sin buffer)');
    }
    await this.ensureRoot();

    const ext = path.extname(file.originalname || '') || '.bin';
    const fname = `${Date.now()}_${Math.random().toString(16).slice(2)}${ext}`;
    const dest = path.join(this.uploadsRoot, fname);
    await fs.writeFile(dest, file.buffer);
    return `/uploads/sections/${fname}`;
  }

  private async deleteIfExists(relPath?: string | null) {
    if (!relPath) return;
    if (!relPath.startsWith('/uploads/sections/')) return;
    const abs = path.join(process.cwd(), relPath.replace(/^\//, ''));
    try {
      await fs.unlink(abs);
    } catch {
      /* noop */
    }
  }

  // ===== sections =====
  async createSection(dto: CreateSectionDto) {
    const s = this.sectionRepo.create({
      sectionKey: dto.sectionKey,
      panelTitle: dto.panelTitle ?? null,
      isVisible: dto.isVisible ?? true,
    });
    return this.sectionRepo.save(s);
  }

  listSections() {
    return this.sectionRepo.find({ order: { id: 'ASC' } });
  }

  async getSectionById(id: number) {
    const s = await this.sectionRepo.findOne({ where: { id } });
    if (!s) throw new NotFoundException('Section not found');
    return s;
  }

  async getSectionByKeyPublic(key: string) {
    const section = await this.sectionRepo.findOne({ where: { sectionKey: key, isVisible: true } });
    if (!section) throw new NotFoundException('Section not found');
    const blocks = await this.blockRepo.find({
      where: { sectionId: section.id, isActive: true },
      order: { displayOrder: 'ASC', id: 'ASC' },
      select: ['id', 'sectionId', 'title', 'body', 'imagePath', 'displayOrder', 'isActive'],
    });
    return { ...section, blocks };
  }

  async updateSection(id: number, dto: UpdateSectionDto) {
    const s = await this.getSectionById(id);
    if (typeof dto.sectionKey !== 'undefined') s.sectionKey = dto.sectionKey;
    if (typeof dto.panelTitle !== 'undefined') s.panelTitle = dto.panelTitle;
    if (typeof dto.isVisible !== 'undefined') s.isVisible = dto.isVisible;
    return this.sectionRepo.save(s);
  }

  async removeSection(id: number) {
    // confirmamos que exista
    const section = await this.sectionRepo.findOne({ where: { id } });
    if (!section) throw new NotFoundException('Section not found');

    // transacción: borrar archivos de bloques y luego la sección
    await this.dataSource.transaction(async (trx) => {
      const blockRepo = trx.getRepository(ContentBlock);
      const sectionRepo = trx.getRepository(PageSection);

      const blocks = await blockRepo.find({ where: { sectionId: id } });

      // borrar archivos primero (fuera de DB)
      await Promise.all(blocks.map((b) => this.deleteIfExists(b.imagePath)));

      // con ON DELETE CASCADE no sería necesario borrar blocks,
      // pero si tu FK no lo tiene, descomenta la línea siguiente:
      // await blockRepo.delete({ sectionId: id });

      await sectionRepo.delete(id);
    });

    return { ok: true };
  }

  // ===== blocks =====
  async listBlocks(sectionId: number) {
    await this.getSectionById(sectionId);
    return this.blockRepo.find({
      where: { sectionId },
      order: { displayOrder: 'ASC', id: 'ASC' },
    });
  }

  async createBlock(sectionId: number, dto: CreateBlockDto, file?: Express.Multer.File) {
    await this.getSectionById(sectionId);

    const imagePath = file ? await this.saveImage(file) : null;

    // normalización
    const providedOrder =
      dto.displayOrder !== undefined && dto.displayOrder !== null
        ? Number(dto.displayOrder)
        : undefined;

    let displayOrder = providedOrder && providedOrder >= 1 ? providedOrder : undefined;

    if (!displayOrder) {
      const last = await this.blockRepo.findOne({
        where: { sectionId },
        order: { displayOrder: 'DESC', id: 'DESC' },
      });
      displayOrder = (last?.displayOrder ?? 0) + 1;
    }

    const isActive =
      typeof dto.isActive === 'boolean'
        ? dto.isActive
        : true;

    const b = this.blockRepo.create({
      sectionId,
      title: dto.title ?? null,
      body: dto.body ?? null,
      displayOrder,
      isActive,
      imagePath,
    });
    return this.blockRepo.save(b);
  }

  async updateBlock(blockId: number, dto: UpdateBlockDto) {
    const b = await this.blockRepo.findOne({ where: { id: blockId } });
    if (!b) throw new NotFoundException('Block not found');

    if (typeof dto.title !== 'undefined') b.title = dto.title;
    if (typeof dto.body !== 'undefined') b.body = dto.body;
    if (typeof dto.isActive !== 'undefined') b.isActive = dto.isActive;
    if (typeof dto.displayOrder !== 'undefined') b.displayOrder = Number(dto.displayOrder);

    return this.blockRepo.save(b);
  }

  async updateBlockImage(blockId: number, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se recibió archivo');
    const b = await this.blockRepo.findOne({ where: { id: blockId } });
    if (!b) throw new NotFoundException('Block not found');
    const newPath = await this.saveImage(file);
    await this.deleteIfExists(b.imagePath);
    b.imagePath = newPath;
    return this.blockRepo.save(b);
  }

  async removeBlockImage(blockId: number) {
    const b = await this.blockRepo.findOne({ where: { id: blockId } });
    if (!b) throw new NotFoundException('Block not found');
    await this.deleteIfExists(b.imagePath);
    b.imagePath = null;
    await this.blockRepo.save(b);
    return { ok: true };
  }

  async removeBlock(blockId: number) {
    const b = await this.blockRepo.findOne({ where: { id: blockId } });
    if (b) {
      await this.deleteIfExists(b.imagePath);
      await this.blockRepo.delete(blockId);
    }
    return { ok: true };
  }
}
