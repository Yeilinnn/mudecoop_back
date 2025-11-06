import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuCategory } from './categories/entities/menu-category.entity';
import { Dish } from './dish/entities/dish.entity';
import { CategoriesService } from './categories/categories.service';
import { CategoriesController } from './categories/categories.controller';
import { DishesService } from './dish/dishes.service';
import { DishesController } from './dish/dishes.controller';
import { StorageService } from '../common/storage/storage.service';

// 👇 nuevos imports
import { MenuPublicService } from './public/menu-public.service';
import { MenuPublicController } from './public/menu-public.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MenuCategory, Dish])],
  providers: [CategoriesService, DishesService, StorageService, MenuPublicService],
  controllers: [CategoriesController, DishesController, MenuPublicController],
  exports: [CategoriesService, DishesService, MenuPublicService],
})
export class MenuModule {}
