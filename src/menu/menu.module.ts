import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MenuCategory } from './categories/entities/menu-category.entity';
import { Dish } from './dish/entities/dish.entity';

import { CategoriesService } from './categories/categories.service';
import { CategoriesController } from './categories/categories.controller';
import { DishesService } from './dish/dishes.service';
import { DishesController } from './dish/dishes.controller';
import { StorageService } from '../common/storage/storage.service';

@Module({
  imports: [TypeOrmModule.forFeature([MenuCategory, Dish])],
  providers: [CategoriesService, DishesService, StorageService],
  controllers: [CategoriesController, DishesController],
  exports: [CategoriesService, DishesService],
})
export class MenuModule {}
