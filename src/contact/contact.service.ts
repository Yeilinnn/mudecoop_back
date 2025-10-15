// src/contact/contact.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactInfo } from './entities/contact-info.entity';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { DEFAULT_TITLE_BY_KIND } from './contact.kinds';

@Injectable()
export class ContactService {
  constructor(@InjectRepository(ContactInfo) private readonly repo: Repository<ContactInfo>) {}

  async create(dto: CreateContactDto) {
    const entity = this.repo.create({
      kind: dto.kind,
      title: DEFAULT_TITLE_BY_KIND[dto.kind] ?? null, // autogenera
      value: dto.value,
      displayOrder: dto.displayOrder,
      isActive: dto.isActive,
    });
    return this.repo.save(entity);
  }

  async list(params?: { kind?: string; active?: boolean }) {
    const qb = this.repo.createQueryBuilder('c').orderBy('c.displayOrder', 'ASC').addOrderBy('c.id', 'ASC');
    if (params?.kind) qb.andWhere('c.kind = :k', { k: params.kind });
    if (typeof params?.active === 'boolean') qb.andWhere('c.isActive = :a', { a: params.active ? 1 : 0 });
    return qb.getMany();
  }

  async get(id: number) {
    const found = await this.repo.findOne({ where: { id } });
    if (!found) throw new NotFoundException('Contact not found');
    return found;
  }

  async update(id: number, dto: UpdateContactDto) {
    const entity = await this.get(id);
    if (dto.kind) {
      entity.kind = dto.kind;
      entity.title = DEFAULT_TITLE_BY_KIND[dto.kind] ?? entity.title; // sincroniza
    }
    if (typeof dto.value !== 'undefined') entity.value = dto.value;
    if (typeof dto.displayOrder !== 'undefined') entity.displayOrder = dto.displayOrder;
    if (typeof dto.isActive !== 'undefined') entity.isActive = dto.isActive;
    return this.repo.save(entity);
  }

  async remove(id: number) {
    await this.repo.delete(id);
    return { ok: true };
  }

  async updateVisibility(id: number, isActive: boolean) {
    const entity = await this.get(id);
    entity.isActive = isActive;
    await this.repo.save(entity);
    return { ok: true };
  }

  async updateOrder(id: number, displayOrder: number) {
    if (!Number.isFinite(displayOrder) || displayOrder < 1) {
      throw new BadRequestException('displayOrder must be >= 1');
    }
    const entity = await this.get(id);
    entity.displayOrder = displayOrder;
    await this.repo.save(entity);
    return { ok: true };
  }

  // PUBLIC
  async listPublic() {
    return this.list({ active: true });
  }
}
