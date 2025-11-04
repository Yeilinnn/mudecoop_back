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
import { CoopActivityService } from './coop-activity.service';
import { CreateCoopActivityDto } from './dto/create-coop-activity.dto';
import { UpdateCoopActivityDto } from './dto/update-coop-activity.dto';
import { CoopActivityBlock } from './coop-activity-block.entity';
import { ActivityReservation } from '../../activity-reservation/entities/activity-reservation.entity';

@ApiTags('Actividades Cooperativas (ADMIN)')
@ApiBearerAuth('bearer')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'EDITOR')
@Controller('coop-activities')
export class CoopActivityController {
  constructor(private readonly service: CoopActivityService) {}

  // ============================================================
  // 🔸 ACTIVIDADES
  // ============================================================

  @Post()
  @ApiOperation({ summary: 'Crear nueva actividad cooperativa' })
  create(@Body() dto: CreateCoopActivityDto) {
    return this.service.create(dto);
  }

  @Post('upload')
  @ApiOperation({ summary: 'Subir imagen y asociarla a una actividad cooperativa' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/coop',
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
        activityId: { type: 'integer', example: 18 },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('activityId', ParseIntPipe) activityId: number,
  ) {
    if (!file) throw new Error('No se ha subido ningún archivo.');
    const imageUrl = `http://localhost:3000/coop/${file.filename}`;
    return this.service.update(activityId, { image_path: imageUrl });
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las actividades (ADMIN)' })
  findAll() {
    return this.service.findAll();
  }

  @Get('public')
  @ApiOperation({ summary: 'Listar solo las actividades activas (públicas)' })
  findActive() {
    return this.service.findActive();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener actividad por ID (ADMIN o pública)' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar actividad cooperativa' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCoopActivityDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar actividad cooperativa' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  // ============================================================
  // 🔸 BLOQUES
  // ============================================================

  @Post(':id/blocks')
  @ApiOperation({ summary: 'Agregar bloque a actividad cooperativa' })
  addBlock(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Partial<CoopActivityBlock>,
  ) {
    return this.service.addBlock(id, data);
  }

  @Get(':id/blocks')
  @ApiOperation({ summary: 'Listar bloques de una actividad cooperativa' })
  findBlocks(@Param('id', ParseIntPipe) id: number) {
    return this.service.findBlocks(id);
  }

  @Patch('blocks/:blockId')
  @ApiOperation({ summary: 'Actualizar bloque de actividad cooperativa' })
  updateBlock(
    @Param('blockId', ParseIntPipe) blockId: number,
    @Body() data: Partial<CoopActivityBlock>,
  ) {
    return this.service.updateBlock(blockId, data);
  }

  @Delete('blocks/:blockId')
  @ApiOperation({ summary: 'Eliminar bloque de actividad cooperativa' })
  removeBlock(@Param('blockId', ParseIntPipe) blockId: number) {
    return this.service.removeBlock(blockId);
  }

  // ✅ NUEVO ENDPOINT: Subir imagen de bloque cooperativo
  @Post('blocks/:blockId/upload')
  @ApiOperation({ summary: 'Subir imagen de un bloque de actividad cooperativa' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/coop',
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
    const imageUrl = `http://localhost:3000/coop/${file.filename}`;
    return this.service.updateBlock(blockId, { image_path: imageUrl });
  }

  // ============================================================
  // 🔸 RESERVAS (Público)
  // ============================================================

  @Post(':id/reservations')
  @ApiOperation({ summary: 'Enviar formulario de reserva (público)' })
  addReservation(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Partial<ActivityReservation>,
  ) {
    return this.service.addReservation(id, data);
  }
}
