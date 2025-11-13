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
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { TourismActivityService } from './tourism-activity.service';
import { CreateTourismActivityDto } from './dto/create-tourism-activity.dto';
import { UpdateTourismActivityDto } from './dto/update-tourism-activity.dto';
import { TourismActivityBlock } from './tourism-activity-block.entity';

@ApiTags('Actividades Turísticas')
@Controller('tourism-activities')
export class TourismActivityController {
  constructor(private readonly service: TourismActivityService) {}

  // ============================================================
  // 🔓 ENDPOINTS PÚBLICOS (SIN AUTENTICACIÓN)
  // ============================================================

  @Get('public')
  @ApiOperation({ summary: 'Listar actividades activas (públicas)' })
  findActive() {
    return this.service.findActive();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener actividad turística por ID (público)' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Get(':id/blocks')
  @ApiOperation({ summary: 'Listar bloques de una actividad turística (público)' })
  findBlocks(@Param('id', ParseIntPipe) id: number) {
    return this.service.findBlocks(id);
  }

  // ============================================================
  // 🔐 ENDPOINTS ADMIN (CON AUTENTICACIÓN)
  // ============================================================

  @Post()
  @ApiBearerAuth('bearer')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'EDITOR')
  @ApiOperation({ summary: 'Crear nueva actividad turística' })
  create(@Body() dto: CreateTourismActivityDto) {
    return this.service.create(dto);
  }

  @Post('upload')
  @ApiBearerAuth('bearer')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'EDITOR')
  @ApiOperation({ summary: 'Subir imagen y asociarla a una actividad turística' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/tourism',
        filename: (req, file, cb) => {
          const uniqueName =
            Date.now() +
            '-' +
            Math.round(Math.random() * 1e9) +
            extname(file.originalname);
          cb(null, uniqueName);
        },
      }),
    }),
  )
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        activityId: { type: 'integer', example: 5 },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('activityId', ParseIntPipe) activityId: number,
  ) {
    if (!file) throw new Error('No se ha subido ningún archivo.');
    const imageUrl = `http://localhost:3000/tourism/${file.filename}`;
    return this.service.update(activityId, { image_path: imageUrl });
  }

  @Get()
  @ApiBearerAuth('bearer')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'EDITOR')
  @ApiOperation({ summary: 'Listar todas las actividades (ADMIN)' })
  findAll() {
    return this.service.findAll();
  }

  @Patch(':id')
  @ApiBearerAuth('bearer')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'EDITOR')
  @ApiOperation({ summary: 'Actualizar actividad turística' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTourismActivityDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth('bearer')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'EDITOR')
  @ApiOperation({ summary: 'Eliminar actividad turística' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  // ============================================================
  // 🔸 BLOQUES
  // ============================================================

  @Post(':id/blocks')
  @ApiBearerAuth('bearer')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'EDITOR')
  @ApiOperation({ summary: 'Agregar bloque de contenido a actividad turística' })
  addBlock(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Partial<TourismActivityBlock>,
  ) {
    return this.service.addBlock(id, data);
  }

  @Patch('blocks/:blockId')
  @ApiBearerAuth('bearer')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'EDITOR')
  @ApiOperation({ summary: 'Actualizar bloque de actividad turística' })
  updateBlock(
    @Param('blockId', ParseIntPipe) blockId: number,
    @Body() data: Partial<TourismActivityBlock>,
  ) {
    return this.service.updateBlock(blockId, data);
  }

  @Delete('blocks/:blockId')
  @ApiBearerAuth('bearer')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'EDITOR')
  @ApiOperation({ summary: 'Eliminar bloque de actividad turística' })
  removeBlock(@Param('blockId', ParseIntPipe) blockId: number) {
    return this.service.removeBlock(blockId);
  }

  @Post('blocks/:blockId/upload')
  @ApiBearerAuth('bearer')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'EDITOR')
  @ApiOperation({ summary: 'Subir imagen de un bloque de actividad turística' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/tourism',
        filename: (req, file, cb) => {
          const uniqueName =
            Date.now() +
            '-' +
            Math.round(Math.random() * 1e9) +
            extname(file.originalname);
          cb(null, uniqueName);
        },
      }),
    }),
  )
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  async uploadBlockImage(
    @Param('blockId', ParseIntPipe) blockId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new Error('No se ha subido ningún archivo.');
    const imageUrl = `http://localhost:3000/tourism/${file.filename}`;
    return this.service.updateBlock(blockId, { image_path: imageUrl });
  }
}