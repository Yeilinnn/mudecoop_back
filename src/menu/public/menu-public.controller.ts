import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MenuPublicService } from './menu-public.service';

@ApiTags('Menú (Público)')
@Controller('public/menu')
export class MenuPublicController {
  constructor(private readonly svc: MenuPublicService) {}

  @Get('categories')
  @ApiOperation({ summary: 'Listar categorías visibles con sus platillos' })
  findAll() {
    return this.svc.findAllActive();
  }

  @Get('categories/:id')
  @ApiOperation({ summary: 'Obtener categoría y sus platillos activos' })
  findByCategory(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findDishesByCategory(id);
  }

  @Get('dishes')
  @ApiOperation({ summary: 'Listar todos los platillos activos' })
  findAllDishes() {
    return this.svc.findAllDishes();
  }
}
