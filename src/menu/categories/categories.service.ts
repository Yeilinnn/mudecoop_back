import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { MenuCategory } from './entities/menu-category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { FilterCategoriesDto } from './dto/filter-categories.dto';
import { StorageService } from '../../common/storage/storage.service';
import { Express } from 'express';

// 👇 importa la entidad Dish (ajusta el path si tu estructura es distinta)
import { Dish } from '../dish/entities/dish.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(MenuCategory)
    private readonly repo: Repository<MenuCategory>,

    // 👇 inyectamos también los platos para poder contarlos al borrar
    @InjectRepository(Dish)
    private readonly dishes: Repository<Dish>,

    private readonly storage: StorageService,
  ) {}

  async create(dto: CreateCategoryDto) {
    const exists = await this.repo.findOne({ where: { name: dto.name } });
    if (exists) throw new BadRequestException('Ya existe una categoría con ese nombre.');

    // Si no mandan displayOrder, tomamos el máximo actual (o 0) y sumamos 1
    if (!dto.displayOrder) {
      const row = await this.repo
        .createQueryBuilder('c')
        .select('COALESCE(MAX(c.displayOrder), 0)', 'max')
        .getRawOne<{ max: string | number }>();
      const currentMax = row ? Number(row.max) : 0;
      dto.displayOrder = currentMax + 1;
    }

    const entity = this.repo.create({
      name: dto.name.trim(),
      description: dto.description?.trim() || null,
      displayOrder: dto.displayOrder,
      isActive: dto.isActive,
      imagePath: null,
    });

    return this.repo.save(entity);
  }

  async findAll(q: FilterCategoriesDto) {
    const where: FindOptionsWhere<MenuCategory> = {};
    if (typeof q.active === 'boolean') where.isActive = q.active;
    return this.repo.find({ where, order: { displayOrder: 'ASC', id: 'ASC' } });
  }

  async update(id: number, dto: UpdateCategoryDto) {
    const cat = await this.repo.findOne({ where: { id } });
    if (!cat) throw new NotFoundException('Categoría no encontrada.');

    if (dto.name && dto.name !== cat.name) {
      const dup = await this.repo.findOne({ where: { name: dto.name } });
      if (dup && dup.id !== id) {
        throw new BadRequestException('Ya existe otra categoría con ese nombre.');
      }
    }

    Object.assign(cat, {
      name: dto.name ?? cat.name,
      description: dto.description ?? cat.description,
      displayOrder: dto.displayOrder ?? cat.displayOrder,
      isActive: typeof dto.isActive === 'boolean' ? dto.isActive : cat.isActive,
    });

    return this.repo.save(cat);
  }

  async updateOrder(id: number, displayOrder: number) {
    if (!Number.isInteger(displayOrder) || displayOrder < 1) {
      throw new BadRequestException('displayOrder debe ser un entero >= 1');
    }
    const cat = await this.repo.findOne({ where: { id } });
    if (!cat) throw new NotFoundException('Categoría no encontrada.');
    cat.displayOrder = displayOrder;
    return this.repo.save(cat);
  }

  async updateVisibility(id: number, isActive: boolean) {
    const cat = await this.repo.findOne({ where: { id } });
    if (!cat) throw new NotFoundException('Categoría no encontrada.');
    cat.isActive = !!isActive;
    return this.repo.save(cat);
  }

  async remove(id: number) {
    const cat = await this.repo.findOne({ where: { id } });
    if (!cat) return { ok: true };

    // 👇 Bloquea borrado si hay platillos asociados
    const count = await this.dishes.count({ where: { categoryId: id } });
    if (count > 0) {
      throw new ConflictException(
        `No se puede eliminar la categoría porque tiene ${count} platillo(s). ` +
          'Mueve o elimina esos platillos primero.',
      );
    }

    await this.storage.removeByPublicPath(cat.imagePath);
    await this.repo.delete(id);
    return { ok: true };
  }

  async setImage(id: number, file: Express.Multer.File) {
    const cat = await this.repo.findOne({ where: { id } });
    if (!cat) throw new NotFoundException('Categoría no encontrada.');

    await this.storage.removeByPublicPath(cat.imagePath);

    const { publicPath } = await this.storage.save(
      file.buffer,
      file.originalname,
      'categories',
    );
    cat.imagePath = publicPath;
    return this.repo.save(cat);
  }

  async deleteImage(id: number) {
    const cat = await this.repo.findOne({ where: { id } });
    if (!cat) throw new NotFoundException('Categoría no encontrada.');
    await this.storage.removeByPublicPath(cat.imagePath);
    cat.imagePath = null;
    return this.repo.save(cat);
  }
}
