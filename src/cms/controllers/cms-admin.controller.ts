import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

import { CmsService } from '../cms.service';
import { CreateSectionDto } from '../dto/create-section.dto';
import { UpdateSectionDto } from '../dto/update-section.dto';
import { CreateBlockDto } from '../dto/create-block.dto';
import { UpdateBlockDto } from '../dto/update-block.dto';

@ApiTags('CMS (ADMIN)')
@ApiBearerAuth('bearer')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'EDITOR')
@Controller('cms/sections')
export class CmsAdminController {
  constructor(private readonly svc: CmsService) {}

  // ===== Sections =====
  @Post()
  @ApiOperation({ summary: 'Crear sección' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        sectionKey: { type: 'string', example: 'historia' },
        panelTitle: { type: 'string', example: 'Historia de Mudecoop' },
        isVisible: { type: 'boolean', example: true },
      },
      required: ['sectionKey'],
    },
  })
  createSection(@Body() dto: CreateSectionDto) {
    return this.svc.createSection(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar secciones' })
  listSections() {
    return this.svc.listSections();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener sección por id' })
  getSection(@Param('id', ParseIntPipe) id: number) {
    return this.svc.getSectionById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar sección (sectionKey, panelTitle, isVisible)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        sectionKey: { type: 'string', example: 'historia' },
        panelTitle: { type: 'string', example: 'Historia de Mudecoop (actualizada)' },
        isVisible: { type: 'boolean', example: true },
      },
    },
  })
  updateSection(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSectionDto) {
    return this.svc.updateSection(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar sección (borra bloques e imágenes)' })
  removeSection(@Param('id', ParseIntPipe) id: number) {
    return this.svc.removeSection(id);
  }

  // ===== Blocks =====
  @Get(':id/blocks')
  @ApiOperation({ summary: 'Listar bloques de una sección' })
  listBlocks(@Param('id', ParseIntPipe) sectionId: number) {
    return this.svc.listBlocks(sectionId);
  }

  @Post(':id/blocks')
  @ApiOperation({ summary: 'Crear bloque (texto + imagen opcional)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: { type: 'string', format: 'binary' },
        title: { type: 'string', example: 'Nuestra historia' },
        body: { type: 'string', example: 'En el año 2000 se fundó…' },
        displayOrder: { type: 'integer', example: 1, minimum: 1 },
        isActive: { type: 'boolean', example: true },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(), // asegura file.buffer
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  createBlock(
    @Param('id', ParseIntPipe) sectionId: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateBlockDto,
  ) {
    return this.svc.createBlock(sectionId, dto, file);
  }

  @Patch('blocks/:blockId')
  @ApiOperation({ summary: 'Editar bloque (sin imagen)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Historia actualizada' },
        body: { type: 'string', example: 'Nuevo texto…' },
        displayOrder: { type: 'integer', example: 2, minimum: 1 },
        isActive: { type: 'boolean', example: true },
      },
    },
  })
  updateBlock(@Param('blockId', ParseIntPipe) blockId: number, @Body() dto: UpdateBlockDto) {
    return this.svc.updateBlock(blockId, dto);
  }

  @Patch('blocks/:blockId/image')
  @ApiOperation({ summary: 'Actualizar imagen del bloque' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  updateBlockImage(
    @Param('blockId', ParseIntPipe) blockId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.svc.updateBlockImage(blockId, file);
  }

  @Delete('blocks/:blockId/image')
  @ApiOperation({ summary: 'Eliminar imagen del bloque' })
  removeBlockImage(@Param('blockId', ParseIntPipe) blockId: number) {
    return this.svc.removeBlockImage(blockId);
  }

  @Delete('blocks/:blockId')
  @ApiOperation({ summary: 'Eliminar bloque (y archivo)' })
  removeBlock(@Param('blockId', ParseIntPipe) blockId: number) {
    return this.svc.removeBlock(blockId);
  }
}
