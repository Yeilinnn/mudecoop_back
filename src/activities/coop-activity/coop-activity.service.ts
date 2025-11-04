import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CoopActivity } from './coop-activity.entity';
import { CreateCoopActivityDto } from './dto/create-coop-activity.dto';
import { UpdateCoopActivityDto } from './dto/update-coop-activity.dto';
import { CoopActivityBlock } from './coop-activity-block.entity';
import { ActivityReservation } from '../../activity-reservation/entities/activity-reservation.entity';

@Injectable()
export class CoopActivityService {
  constructor(
    @InjectRepository(CoopActivity)
    private readonly repo: Repository<CoopActivity>,

    @InjectRepository(CoopActivityBlock)
    private readonly blockRepo: Repository<CoopActivityBlock>,

    @InjectRepository(ActivityReservation)
    private readonly resRepo: Repository<ActivityReservation>,
  ) {}

  // 🔹 Listar todas
  async findAll(): Promise<CoopActivity[]> {
    return this.repo.find({ order: { id: 'DESC' }, relations: ['blocks'] });
  }

  // 🔹 Listar activas (públicas)
  async findActive(): Promise<CoopActivity[]> {
    return this.repo.find({
      where: { is_active: 1 },
      order: { id: 'DESC' },
      relations: ['blocks'],
    });
  }

  // 🔹 Buscar por ID
  async findOne(id: number): Promise<CoopActivity> {
    const act = await this.repo.findOne({
      where: { id },
      relations: ['blocks', 'reservations'],
    });
    if (!act) throw new NotFoundException('Actividad no encontrada');
    return act;
  }

  // 🔹 Crear
  async create(data: CreateCoopActivityDto): Promise<CoopActivity> {
    const newAct = this.repo.create({
      ...data,
      start_at: data.start_at ? new Date(data.start_at) : null,
      end_at: data.end_at ? new Date(data.end_at) : null,
    });
    return this.repo.save(newAct);
  }

  // 🔹 Actualizar
  async update(id: number, data: UpdateCoopActivityDto): Promise<CoopActivity> {
    const act = await this.findOne(id);
    Object.assign(act, {
      ...data,
      start_at: data.start_at ? new Date(data.start_at) : act.start_at ?? null,
      end_at: data.end_at ? new Date(data.end_at) : act.end_at ?? null,
    });
    return this.repo.save(act);
  }

  // 🔹 Eliminar actividad
  async remove(id: number): Promise<{ message: string }> {
    const act = await this.findOne(id);
    await this.repo.remove(act);
    return { message: 'Actividad eliminada correctamente' };
  }

  // ============================================================
  // 🔸 BLOQUES
  // ============================================================

  // 🔹 Agregar bloque
  async addBlock(activityId: number, data: Partial<CoopActivityBlock>): Promise<CoopActivityBlock> {
    const activity = await this.findOne(activityId);
    const block = this.blockRepo.create({ ...data, activity });
    return this.blockRepo.save(block);
  }

  // 🔹 Listar bloques
  async findBlocks(activityId: number): Promise<CoopActivityBlock[]> {
    const activity = await this.findOne(activityId);
    return this.blockRepo.find({
      where: { activity: { id: activity.id } },
      order: { display_order: 'ASC' },
    });
  }

  // 🔹 Actualizar bloque
  async updateBlock(blockId: number, data: Partial<CoopActivityBlock>): Promise<CoopActivityBlock> {
    const block = await this.blockRepo.findOne({ where: { id: blockId } });
    if (!block) throw new NotFoundException('Bloque no encontrado');
    Object.assign(block, data);
    return this.blockRepo.save(block);
  }

  // 🔹 Eliminar bloque
  async removeBlock(blockId: number): Promise<{ message: string }> {
    const block = await this.blockRepo.findOne({ where: { id: blockId } });
    if (!block) throw new NotFoundException('Bloque no encontrado');
    await this.blockRepo.remove(block);
    return { message: 'Bloque eliminado correctamente' };
  }

  // ============================================================
  // 🔸 RESERVAS (Público)
  // ============================================================

  async addReservation(
    activityId: number,
    data: Partial<ActivityReservation>,
  ): Promise<ActivityReservation> {
    const activity = await this.findOne(activityId);
    const reservation = this.resRepo.create({ ...data, activity });
    return this.resRepo.save(reservation);
  }
}
