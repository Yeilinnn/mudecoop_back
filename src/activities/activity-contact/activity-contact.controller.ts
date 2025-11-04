import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ActivityContactService } from './activity-contact.service';
import { CreateActivityContactDto } from './dto/create-activity-contact.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Activity Contacts')
@Controller('activity-contacts')
export class ActivityContactController {
  constructor(private readonly contactService: ActivityContactService) {}

  // 🟢 Público: formulario de contacto desde la landing
  @Post(':activityId')
  @ApiOperation({
    summary: 'Crear un nuevo contacto asociado a una actividad (público)',
  })
  create(
    @Param('activityId', ParseIntPipe) activityId: number,
    @Body() dto: CreateActivityContactDto,
  ) {
    return this.contactService.create(activityId, dto);
  }

  // 🔒 Solo admin/editor
  @Get(':activityId')
  @ApiBearerAuth('bearer')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'EDITOR')
  @ApiOperation({ summary: 'Listar contactos de una actividad' })
  findAll(@Param('activityId', ParseIntPipe) activityId: number) {
    return this.contactService.findAllByActivity(activityId);
  }

  @Delete(':id')
  @ApiBearerAuth('bearer')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Eliminar contacto' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.contactService.remove(id);
  }
}
