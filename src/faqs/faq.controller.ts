import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FaqService } from './faq.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@ApiTags('FAQ')
@ApiBearerAuth('bearer')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('faq')
export class FaqController {
  constructor(private readonly faqService: FaqService) {}

  /** 🔹 Crear FAQ — Solo ADMIN o EDITOR */
  @Post()
  @Roles('ADMIN', 'EDITOR')
  create(@Body() dto: CreateFaqDto) {
    return this.faqService.create(dto);
  }

  /** 🔹 Obtener todas las FAQs — Solo ADMIN o EDITOR */
  @Get()
  @Roles('ADMIN', 'EDITOR')
  findAll() {
    return this.faqService.findAll();
  }

  /** 🔹 Obtener una FAQ específica — Solo ADMIN o EDITOR */
  @Get(':id')
  @Roles('ADMIN', 'EDITOR')
  findOne(@Param('id') id: number) {
    return this.faqService.findOne(+id);
  }

  /** 🔹 Actualizar FAQ — Solo ADMIN o EDITOR */
  @Patch(':id')
  @Roles('ADMIN', 'EDITOR')
  update(@Param('id') id: number, @Body() dto: UpdateFaqDto) {
    return this.faqService.update(+id, dto);
  }

  /** 🔹 Eliminar FAQ — Solo ADMIN */
  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: number) {
    return this.faqService.remove(+id);
  }
}
