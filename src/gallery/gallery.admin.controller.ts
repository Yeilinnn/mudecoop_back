import {
  Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UploadedFile,
  UseGuards, UseInterceptors, Query
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

import { GalleryService } from './gallery.service';
import { CreateGalleryDto } from './dto/create-gallery.dto';
import { UpdateGalleryDto } from './dto/update-gallery.dto';
import { FilterGalleryDto } from './dto/filter-gallery.dto';
import { CreateImageDto } from './dto/create-image.dto';

// 🔁 DTOs comunes (reemplazan a UpdateGalleryVisibilityDto y UpdateVisibilityDto)
import { ToggleActiveDto } from '../common/dto/toggle-active.dto';
import { ToggleVisibilityDto } from '../common/dto/toggle-visibility.dto';

@ApiTags('Galería (ADMIN)')
@ApiBearerAuth('bearer')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'EDITOR')
@Controller('gallery')
export class GalleryAdminController {
  constructor(private readonly svc: GalleryService) {}

  // ===== Galleries =====
  @Post()
  @ApiOperation({ summary: 'Crear galería' })
  createGallery(@Body() dto: CreateGalleryDto) {
    return this.svc.createGallery(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar galerías (opcional ?active=true|false)' })
  listGalleries(@Query() q: FilterGalleryDto) {
    return this.svc.listGalleries(q);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener galería con imágenes (ADMIN)' })
  getGallery(@Param('id', ParseIntPipe) id: number) {
    return this.svc.getGalleryWithImages(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar galería' })
  updateGallery(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateGalleryDto) {
    return this.svc.updateGallery(id, dto);
  }

  @Patch(':id/visibility')
  @ApiOperation({ summary: 'Activar/Inactivar galería' })
  updateGalleryVisibility(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ToggleActiveDto, // 👈 unificado
  ) {
    return this.svc.updateGalleryVisibility(id, body.isActive);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar galería (borra imágenes y archivos)' })
  removeGallery(@Param('id', ParseIntPipe) id: number) {
    return this.svc.removeGallery(id);
  }

  // ===== Images =====
  @Post(':id/images')
  @ApiOperation({ summary: 'Subir imagen a una galería' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: { type: 'string', format: 'binary' },
        displayOrder: { type: 'number' },
        isVisible: { type: 'boolean' },
      },
      required: ['image'],
    },
  })
  @UseInterceptors(FileInterceptor('image'))
  uploadImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreateImageDto,
  ) {
    return this.svc.addImage(id, file, body);
  }

  @Get(':id/images')
  @ApiOperation({ summary: 'Listar imágenes de una galería (ADMIN)' })
  listImages(@Param('id', ParseIntPipe) id: number) {
    return this.svc.listImages(id);
  }

  // ✅ Toggle visibilidad (NECESARIO para el front)
  @Patch('images/:imageId/visibility')
  @ApiOperation({ summary: 'Mostrar/Ocultar imagen' })
  updateImageVisibility(
    @Param('imageId', ParseIntPipe) imageId: number,
    @Body() body: ToggleVisibilityDto, // 👈 unificado
  ) {
    return this.svc.updateImageVisibility(imageId, body.isVisible);
  }

  @Delete('images/:imageId')
  @ApiOperation({ summary: 'Eliminar imagen (y su archivo)' })
  removeImage(@Param('imageId', ParseIntPipe) imageId: number) {
    return this.svc.removeImage(imageId);
  }
}
