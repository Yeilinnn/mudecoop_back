import {
  Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { FilterCategoriesDto } from './dto/filter-categories.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

// 🔁 DTO común (reemplaza a UpdateVisibilityDto local)
import { ToggleActiveDto } from '../../common/dto/toggle-active.dto';

@ApiTags('Menú / Categorías')
@ApiBearerAuth('bearer')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'EDITOR')
@Controller('menu/categories')
export class CategoriesController {
  constructor(private readonly svc: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear categoría (JSON)' })
  create(@Body() dto: CreateCategoryDto) {
    return this.svc.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar categorías (con filtros opcionales)' })
  list(@Query() q: FilterCategoriesDto) {
    return this.svc.findAll(q);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar categoría (JSON)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCategoryDto) {
    return this.svc.update(id, dto);
  }

  @Patch(':id/position')
  @ApiOperation({ summary: 'Actualizar orden' })
  updateOrder(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateOrderDto) {
    return this.svc.updateOrder(id, body.displayOrder);
  }

  @Patch(':id/visibility')
  @ApiOperation({ summary: 'Activar/Inactivar' })
  updateVisibility(@Param('id', ParseIntPipe) id: number, @Body() body: ToggleActiveDto) { // 👈 unificado
    return this.svc.updateVisibility(id, body.isActive);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar categoría' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.svc.remove(id);
  }

  // Imagen
  @Post(':id/image')
  @ApiOperation({ summary: 'Subir/Reemplazar imagen' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: { type: 'object', properties: { image: { type: 'string', format: 'binary' } }, required: ['image'] },
  })
  @UseInterceptors(FileInterceptor('image'))
  uploadImage(@Param('id', ParseIntPipe) id: number, @UploadedFile() image: Express.Multer.File) {
    return this.svc.setImage(id, image);
  }

  @Delete(':id/image')
  @ApiOperation({ summary: 'Eliminar imagen' })
  deleteImage(@Param('id', ParseIntPipe) id: number) {
    return this.svc.deleteImage(id);
  }
}
