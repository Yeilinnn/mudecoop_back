import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ContactService } from './contact.service';
import { CONTACT_KINDS } from './contact.kinds';

@ApiTags('Contacto (PUBLIC)')
@Controller('public/contact')
export class ContactPublicController {
  constructor(private readonly svc: ContactService) {}

  @Get()
  @ApiOperation({ summary: 'Listar contactos públicos (solo activos)' })
  @ApiQuery({
    name: 'kind',
    required: false,
    description: `Filtrar por tipo de contacto (opcional). Ejemplo: 'email', 'facebook', 'phone'.`,
    enum: CONTACT_KINDS,
    example: 'facebook',
  })
  list(@Query('kind') kind?: (typeof CONTACT_KINDS)[number]) {
    // Si viene el tipo, filtra solo ese tipo activo
    if (kind) {
      return this.svc.list({ kind, active: true });
    }
    return this.svc.listPublic();
  }
}
