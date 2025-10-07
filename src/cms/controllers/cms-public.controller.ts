import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CmsService } from './../cms.service';

@ApiTags('CMS (PUBLIC)')
@Controller('public/cms')
export class CmsPublicController {
  constructor(private readonly svc: CmsService) {}

  @Get('section')
  @ApiOperation({ summary: 'Obtener sección pública por clave (sólo bloques activos)' })
  @ApiQuery({ name: 'key', required: true, example: 'historia' })
  getSectionByKey(@Query('key') key: string) {
    return this.svc.getSectionByKeyPublic(key);
  }
}
