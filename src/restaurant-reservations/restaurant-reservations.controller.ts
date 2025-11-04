import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UsePipes,
  ValidationPipe,
  UseGuards,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
  ApiOperation,
} from '@nestjs/swagger';
import { RestaurantReservationsService } from './restaurant-reservations.service';
import { CreateRestaurantReservationDto } from './dto/create-restaurant-reservation.dto';
import { UpdateRestaurantReservationDto } from './dto/update-restaurant-reservation.dto';
import { ChangeStatusRestaurantDto } from './dto/change-status-restaurant.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@ApiTags('Restaurant Reservations')
@Controller('restaurant-reservations')
export class RestaurantReservationsController {
  constructor(
    private readonly reservationsService: RestaurantReservationsService,
  ) {}

  // ✅ Pública, pero detecta si hay usuario autenticado
  @Post()
  @ApiOperation({ summary: 'Crear nueva reserva (landing o panel admin)' })
  @ApiBody({ type: CreateRestaurantReservationDto })
  @ApiResponse({ status: 201, description: 'Reserva creada correctamente' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  create(@Body() dto: CreateRestaurantReservationDto, @Req() req: any) {
    const userId = req?.user?.id ?? null;
    return this.reservationsService.create(dto, userId);
  }

  @ApiBearerAuth('bearer')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'EDITOR')
  @Get()
  @ApiOperation({ summary: 'Listar todas las reservas' })
  findAll() {
    return this.reservationsService.findAll();
  }

  @ApiBearerAuth('bearer')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'EDITOR')
  @Get(':id')
  @ApiOperation({ summary: 'Obtener reserva por ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reservationsService.findOne(id);
  }

  @ApiBearerAuth('bearer')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'EDITOR')
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar datos de la reserva' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRestaurantReservationDto,
  ) {
    return this.reservationsService.update(id, dto);
  }

  @ApiBearerAuth('bearer')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'EDITOR')
  @Patch(':id/status')
  @ApiOperation({ summary: 'Confirmar o cancelar reserva' })
  @ApiBody({ type: ChangeStatusRestaurantDto })
  changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangeStatusRestaurantDto,
    @Req() req: any,
  ) {
    const userId = req?.user?.id ?? null;
    return this.reservationsService.updateStatus(id, dto, userId);
  }

  @ApiBearerAuth('bearer')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
@Delete(':id')
@ApiOperation({ summary: 'Eliminar reserva' })
async remove(@Param('id', ParseIntPipe) id: number) {
  await this.reservationsService.remove(id);
  return { success: true, message: 'Reserva eliminada correctamente' }; // ✅
}

}
