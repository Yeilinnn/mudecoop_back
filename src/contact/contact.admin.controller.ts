import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { FilterContactDto } from './dto/filter-contact.dto';
import { UpdateContactOrderDto } from './dto/update-order.dto';
import { ToggleActiveDto } from '../common/dto/toggle-active.dto';
import { CONTACT_KINDS } from './contact.kinds';

@ApiTags('Contacto (ADMIN)')
@ApiBearerAuth('bearer')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'EDITOR')
@Controller('contact')
export class ContactAdminController {
  constructor(private readonly svc: ContactService) {}

  @Post()
  @ApiOperation({ summary: 'Crear dato de contacto' })
  @ApiBody({
    description: 'Datos requeridos para crear un contacto',
    type: CreateContactDto,
    examples: {
      example1: {
        summary: 'Ejemplo teléfono',
        value: {
          kind: 'phone',
          value: '+506 8888-8888',
          displayOrder: 1,
          isActive: true,
        },
      },
      example2: {
        summary: 'Ejemplo dirección',
        value: {
          kind: 'address',
          value: 'San José, Costa Rica',
          displayOrder: 2,
          isActive: true,
        },
      },
    },
  })
  create(@Body() dto: CreateContactDto) {
    return this.svc.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar contactos (filtros opcionales)' })
  @ApiQuery({
    name: 'kind',
    required: false,
    description: `Filtrar por tipo (opcional). Valores permitidos: ${CONTACT_KINDS.join(', ')}`,
    enum: CONTACT_KINDS,
    example: 'email',
  })
  @ApiQuery({
    name: 'active',
    required: false,
    description: 'Filtrar por estado de visibilidad',
    example: true,
  })
  list(@Query() q: FilterContactDto) {
    return this.svc.list({
      kind: q.kind,
      active: typeof q.active !== 'undefined' ? q.active === true : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un contacto por ID' })
  @ApiParam({ name: 'id', example: 3 })
  get(@Param('id', ParseIntPipe) id: number) {
    return this.svc.get(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar un contacto existente' })
  @ApiParam({ name: 'id', example: 3 })
  @ApiBody({
    description: 'Campos editables',
    type: UpdateContactDto,
    examples: {
      example1: {
        summary: 'Actualizar valor o tipo',
        value: {
          kind: 'instagram',
          value: '@mudecoopcr',
          isActive: true,
        },
      },
    },
  })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateContactDto) {
    return this.svc.update(id, dto);
  }

  @Patch(':id/visibility')
  @ApiOperation({ summary: 'Activar o inactivar contacto' })
  @ApiParam({ name: 'id', example: 3 })
  @ApiBody({
    description: 'Cambia el estado visible/inactivo',
    examples: {
      activar: { value: { isActive: true } },
      desactivar: { value: { isActive: false } },
    },
  })
  updateVisibility(@Param('id', ParseIntPipe) id: number, @Body() body: ToggleActiveDto) {
    return this.svc.updateVisibility(id, body.isActive);
  }

  @Patch(':id/order')
  @ApiOperation({ summary: 'Actualizar orden de visualización' })
  @ApiParam({ name: 'id', example: 3 })
  @ApiBody({
    description: 'Define un nuevo orden (mínimo 1)',
    examples: {
      ejemplo: { value: { displayOrder: 5 } },
    },
  })
  updateOrder(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateContactOrderDto) {
    return this.svc.updateOrder(id, body.displayOrder);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar contacto por ID' })
  @ApiParam({ name: 'id', example: 3 })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.svc.remove(id);
  }
}
