import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Dish } from './entities/dish.entity';
import { CreateDishDto } from './dto/create-dish.dto';
import { UpdateDishDto } from './dto/update-dish.dto';
import { FilterDishesDto } from './dto/filter-dishes.dto';
import { MenuCategory } from '../categories/entities/menu-category.entity';

@Injectable()
export class DishesService {
  constructor(
    @InjectRepository(Dish) private readonly repo: Repository<Dish>,
    @InjectRepository(MenuCategory) private readonly cats: Repository<MenuCategory>,
  ) {}

  private async assertCategory(id: number) {
    const cat = await this.cats.findOne({ where: { id } });
    if (!cat) throw new BadRequestException('Categoría no existe.');
    return cat;
  }

  async create(dto: CreateDishDto) {
    await this.assertCategory(dto.categoryId);

    if (!dto.displayOrder) {
      const row = await this.repo.createQueryBuilder('d')
        .select('MAX(d.displayOrder)', 'max')
        .where('d.categoryId = :cid', { cid: dto.categoryId })
        .getRawOne<{ max: string | null }>();
      const max = row?.max ? Number(row.max) : 0;
      dto.displayOrder = max + 1;
    }

    const entity = this.repo.create({
      categoryId: dto.categoryId,
      name: dto.name.trim(),
      description: dto.description?.trim() || null,
      price: Number(dto.price).toFixed(2), // guardado como string
      displayOrder: dto.displayOrder,
      isActive: dto.isActive ?? true,
    });

    return this.repo.save(entity);
  }

  async findAll(q: FilterDishesDto) {
    const where: FindOptionsWhere<Dish> = {};
    if (q.categoryId) where.categoryId = q.categoryId;
    if (typeof q.active === 'boolean') where.isActive = q.active;

    return this.repo.find({
      where,
      order: { displayOrder: 'ASC', id: 'ASC' },
    });
  }

  async findOne(id: number) {
    const dish = await this.repo.findOne({ where: { id } });
    if (!dish) throw new NotFoundException('Platillo no encontrado.');
    return dish;
  }

  async update(id: number, dto: UpdateDishDto) {
    const dish = await this.findOne(id);

    if (dto.categoryId && dto.categoryId !== dish.categoryId) {
      await this.assertCategory(dto.categoryId);
      dish.categoryId = dto.categoryId;
    }

    dish.name = dto.name?.trim() ?? dish.name;
    dish.description = dto.description?.trim() ?? dish.description;
    dish.price = typeof dto.price === 'number' ? Number(dto.price).toFixed(2) : dish.price;
    dish.displayOrder = dto.displayOrder ?? dish.displayOrder;
    dish.isActive = typeof dto.isActive === 'boolean' ? dto.isActive : dish.isActive;

    return this.repo.save(dish);
  }

  async updateOrder(id: number, displayOrder: number) {
    if (!Number.isInteger(displayOrder) || displayOrder < 1) {
      throw new BadRequestException('displayOrder debe ser un entero >= 1');
    }
    const dish = await this.findOne(id);
    dish.displayOrder = displayOrder;
    return this.repo.save(dish);
  }

  async updateVisibility(id: number, isActive: boolean) {
    const dish = await this.findOne(id);
    dish.isActive = !!isActive;
    return this.repo.save(dish);
  }

  async remove(id: number) {
    const dish = await this.repo.findOne({ where: { id } });
    if (!dish) return { ok: true };
    await this.repo.delete(id);
    return { ok: true };
  }
}
