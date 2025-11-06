import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuCategory } from '../categories/entities/menu-category.entity';
import { Dish } from '../dish/entities/dish.entity';

@Injectable()
export class MenuPublicService {
  constructor(
    @InjectRepository(MenuCategory)
    private readonly categoriesRepo: Repository<MenuCategory>,

    @InjectRepository(Dish)
    private readonly dishesRepo: Repository<Dish>,
  ) {}

  /**
   * 🔹 Listar categorías visibles con sus platillos activos
   */
  async findAllActive() {
    const categories = await this.categoriesRepo.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC', id: 'ASC' },
    });

    // 👇 definimos el tipo explícitamente
    const result: Array<MenuCategory & { dishes: Dish[] }> = [];

    for (const cat of categories) {
      const dishes = await this.dishesRepo.find({
        where: { categoryId: cat.id, isActive: true },
        order: { displayOrder: 'ASC', id: 'ASC' },
      });
      result.push({ ...cat, dishes });
    }

    return result;
  }

  /**
   * 🔹 Obtener los platillos activos de una categoría específica
   */
  async findDishesByCategory(categoryId: number) {
    const category = await this.categoriesRepo.findOne({
      where: { id: categoryId, isActive: true },
    });
    if (!category) return null;

    const dishes = await this.dishesRepo.find({
      where: { categoryId, isActive: true },
      order: { displayOrder: 'ASC', id: 'ASC' },
    });

    return { ...category, dishes };
  }

  /**
   * 🔹 Obtener todos los platillos activos (sin agrupar)
   */
  async findAllDishes() {
    return this.dishesRepo.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC', id: 'ASC' },
    });
  }
}
