import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityContact } from './activity-contact.entity';
import { CoopActivity } from '../coop-activity/coop-activity.entity';
import { CreateActivityContactDto } from './dto/create-activity-contact.dto';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class ActivityContactService {
  constructor(
    @InjectRepository(ActivityContact)
    private readonly contactRepo: Repository<ActivityContact>,

    @InjectRepository(CoopActivity)
    private readonly activityRepo: Repository<CoopActivity>,

    @Optional()
    private readonly notificationsService?: NotificationsService,
  ) {}

  // ==========================================================
  // 📨 Crear un nuevo contacto desde la landing
  // ==========================================================
  async create(
    activityId: number,
    dto: CreateActivityContactDto,
  ): Promise<ActivityContact> {
    const activity = await this.activityRepo.findOne({ where: { id: activityId } });
    if (!activity) throw new NotFoundException('Actividad no encontrada');

    const saved = await this.contactRepo.save({ ...dto, activity });

    // ✅ UNA SOLA notificación que maneja:
    // - PUSH al admin (por el type: 'PUSH')
    // - EMAIL al admin (automático por el type)
    // - EMAIL al cliente (por toEmail)
    await this.notificationsService?.create({
      category: 'ACTIVITY',
      title: 'Nuevo formulario de contacto',
      message: `${saved.full_name} ha enviado un mensaje sobre "${activity.title}": "${saved.message ?? '(sin mensaje)'}"`,
      type: 'PUSH', // 👈 PUSH al admin + EMAIL al admin
      toEmail: saved.email, // 👈 EMAIL de confirmación al cliente (si existe)
    });

    return saved;
  }

  // ==========================================================
  // 📄 Listar contactos por actividad (FIRMA requerida)
  // ==========================================================
  async findAllByActivity(activityId: number): Promise<ActivityContact[]> {
    return this.contactRepo.find({
      where: { activity: { id: activityId } as any },
      relations: ['activity'],
      order: { created_at: 'DESC' as any },
    });
  }

  // ==========================================================
  // ❌ Eliminar contacto (FIRMA requerida)
  // ==========================================================
  async remove(id: number): Promise<void> {
    await this.contactRepo.delete(id);
  }
}