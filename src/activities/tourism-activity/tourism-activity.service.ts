import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TourismActivity } from './tourism-activity.entity';
import { TourismActivityBlock } from './tourism-activity-block.entity';
import { CreateTourismActivityDto } from './dto/create-tourism-activity.dto';
import { UpdateTourismActivityDto } from './dto/update-tourism-activity.dto';

@Injectable()
export class TourismActivityService {
  constructor(
    @InjectRepository(TourismActivity)
    private readonly repo: Repository<TourismActivity>,

    @InjectRepository(TourismActivityBlock)
    private readonly blockRepo: Repository<TourismActivityBlock>,
  ) {}

  // ============================================================
  // 🔸 ACTIVIDADES
  // ============================================================

  async create(data: CreateTourismActivityDto): Promise<TourismActivity> {
    try {
      const newAct = this.repo.create(data);
      return await this.repo.save(newAct);
    } catch (err) {
      console.error('❌ Error al crear actividad turística:', err);
      throw new InternalServerErrorException('Error al crear la actividad turística');
    }
  }

  async findAll(): Promise<TourismActivity[]> {
    return this.repo.find({
      order: { id: 'DESC' },
      relations: ['blocks'],
    });
  }

  async findActive(): Promise<TourismActivity[]> {
    return this.repo.find({
      where: { is_active: 1 },
      order: { id: 'DESC' },
      relations: ['blocks'],
    });
  }

  async findOne(id: number): Promise<TourismActivity> {
    const act = await this.repo.findOne({
      where: { id },
      relations: ['blocks'],
    });
    if (!act) throw new NotFoundException('Actividad turística no encontrada');
    return act;
  }

  async update(id: number, data: UpdateTourismActivityDto): Promise<TourismActivity> {
    const act = await this.findOne(id);
    Object.assign(act, data);
    return await this.repo.save(act);
  }

  async remove(id: number): Promise<{ message: string }> {
    const act = await this.findOne(id);
    await this.repo.remove(act);
    return { message: 'Actividad turística eliminada correctamente' };
  }

  // ============================================================
  // 🔸 BLOQUES
  // ============================================================

  async addBlock(activityId: number, data: Partial<TourismActivityBlock>): Promise<TourismActivityBlock> {
    const activity = await this.findOne(activityId);
    const block = this.blockRepo.create({ ...data, activity });
    return this.blockRepo.save(block);
  }

  async findBlocks(activityId: number): Promise<TourismActivityBlock[]> {
    const activity = await this.findOne(activityId);
    return this.blockRepo.find({
      where: { activity: { id: activity.id } },
      order: { display_order: 'ASC' },
    });
  }

  async updateBlock(blockId: number, data: Partial<TourismActivityBlock>): Promise<TourismActivityBlock> {
    const block = await this.blockRepo.findOne({ where: { id: blockId } });
    if (!block) throw new NotFoundException('Bloque no encontrado');
    Object.assign(block, data);
    return this.blockRepo.save(block);
  }

  async removeBlock(blockId: number): Promise<{ message: string }> {
    const block = await this.blockRepo.findOne({ where: { id: blockId } });
    if (!block) throw new NotFoundException('Bloque no encontrado');
    await this.blockRepo.remove(block);
    return { message: 'Bloque eliminado correctamente' };
  }
}
