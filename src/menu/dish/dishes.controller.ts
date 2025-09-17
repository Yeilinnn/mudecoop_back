import {
  Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DishesService } from './dishes.service';
import { CreateDishDto } from './dto/create-dish.dto';
import { UpdateDishDto } from './dto/update-dish.dto';
import { FilterDishesDto } from './dto/filter-dishes.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateVisibilityDto } from './dto/update-visibility.dto';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Menú / Platos')
@ApiBearerAuth('bearer')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'EDITOR')
@Controller('menu/dishes')
export class DishesController {
  constructor(private readonly svc: DishesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear platillo (JSON)' })
  create(@Body() dto: CreateDishDto) {
    return this.svc.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar platillos (filtros opcionales)' })
  list(@Query() q: FilterDishesDto) {
    return this.svc.findAll(q);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar platillo (JSON)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDishDto) {
    return this.svc.update(id, dto);
  }

  @Patch(':id/position')
  @ApiOperation({ summary: 'Actualizar orden dentro de su categoría' })
  @ApiBody({
    schema: { type: 'object', properties: { displayOrder: { type: 'integer', example: 2 } }, required: ['displayOrder'] },
  })
  updateOrder(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateOrderDto) {
    return this.svc.updateOrder(id, body.displayOrder);
  }

  @Patch(':id/visibility')
  @ApiOperation({ summary: 'Activar/Inactivar platillo' })
  @ApiBody({
    schema: { type: 'object', properties: { isActive: { type: 'boolean', example: true } }, required: ['isActive'] },
  })
  updateVisibility(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateVisibilityDto) {
    return this.svc.updateVisibility(id, body.isActive);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar platillo' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.svc.remove(id);
  }
}
