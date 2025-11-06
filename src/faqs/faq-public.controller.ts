import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FaqPublicService } from './faq-public.service';

@ApiTags('FAQ (Público)')
@Controller('public/faq')
export class FaqPublicController {
  constructor(private readonly svc: FaqPublicService) {}

  @Get()
  @ApiOperation({ summary: 'Listar FAQs visibles (para landing)' })
  list() {
    return this.svc.findVisible();
  }
}
