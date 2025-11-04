import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { ActivityReservationService } from './activity-reservation.service';
import { CreateActivityReservationDto } from './dto/create-activity-reservation.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@ApiTags('Activity Reservations')
@Controller('activity-reservations')
export class ActivityReservationController {
  constructor(private readonly reservationService: ActivityReservationService) {}

  // 🟢 Público (landing)
  @Post(':activityId')
  @ApiOperation({ summary: 'Crear una nueva reserva para una actividad (público)' })
  @ApiParam({ name: 'activityId', type: Number, example: 1 })
  @ApiBody({ type: CreateActivityReservationDto })
  @ApiResponse({ status: 201, description: 'Reserva creada exitosamente' })
  create(
    @Param('activityId', ParseIntPipe) activityId: number,
    @Body() dto: CreateActivityReservationDto,
  ) {
    return this.reservationService.create(activityId, dto);
  }

  // 🔒 Solo admin/editor
  @Get(':activityId')
  @ApiBearerAuth('bearer')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'EDITOR')
  @ApiOperation({ summary: 'Listar todas las reservas asociadas a una actividad' })
  findAll(@Param('activityId', ParseIntPipe) activityId: number) {
    return this.reservationService.findAllByActivity(activityId);
  }

  @Patch(':id/status')
  @ApiBearerAuth('bearer')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'EDITOR')
  @ApiOperation({ summary: 'Actualizar el estado de una reserva' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { status: { type: 'string', example: 'confirmed' } },
    },
  })
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body('status') status: string) {
    return this.reservationService.updateStatus(id, status);
  }

  @Delete(':id')
  @ApiBearerAuth('bearer')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Eliminar una reserva' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.reservationService.remove(id);
  }
}
