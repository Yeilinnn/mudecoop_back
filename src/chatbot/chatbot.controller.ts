import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { BotReplyDto } from './dto/reply.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@ApiTags('Chatbot')
@Controller('bot')
export class ChatbotController {
  constructor(private readonly svc: ChatbotService) {}

  // ==============================================
  // 🩺 Health (PÚBLICO)
  // ==============================================
  @Get('health')
  health() {
    return this.svc.health();
  }

  // ==============================================
  // 💬 Mensajes iniciales/bienvenida (PÚBLICO) ✨ NUEVO
  // ==============================================
  @Get('messages/initial')
  async getInitialMessages() {
    return this.svc.getInitialMessages();
  }

  // ==============================================
  // 🧠 Responder mensajes (PÚBLICO)
  // ==============================================
  @Post('reply')
  @HttpCode(HttpStatus.OK)
  async reply(@Body() dto: BotReplyDto) {
    // Cambiar a usar 'message' en lugar de 'query'
    return this.svc.reply(dto.message, dto.lang ?? 'es');
  }

  // ==============================================
  // ⚙️ Configuración ON/OFF
  // ==============================================
  @Get('setting')
  @ApiBearerAuth('bearer')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'EDITOR')
  getSetting() {
    return this.svc.getSetting();
  }

  @Patch('setting')
  @ApiBearerAuth('bearer')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'EDITOR')
  updateSetting(@Body() dto: UpdateSettingDto) {
    return this.svc.updateSetting(dto.isEnabled);
  }

  // ==============================================
  // 💬 CRUD de mensajes automáticos (ADMIN)
  // ==============================================
  @Get('messages')
  @ApiBearerAuth('bearer')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'EDITOR')
  getMessages() {
    return this.svc.getMessages();
  }

  @Post('messages')
  @ApiBearerAuth('bearer')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'EDITOR')
  createMessage(@Body() dto: CreateMessageDto) {
    return this.svc.createMessage(dto);
  }

  @Patch('messages/:id')
  @ApiBearerAuth('bearer')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'EDITOR')
  updateMessage(@Param('id') id: number, @Body() dto: UpdateMessageDto) {
    return this.svc.updateMessage(+id, dto);
  }

  @Delete('messages/:id')
  @ApiBearerAuth('bearer')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'EDITOR')
  deleteMessage(@Param('id') id: number) {
    return this.svc.deleteMessage(+id);
  }

  // ==============================================
  // 🔁 Recargar índice FAQs manualmente
  // ==============================================
  @Post('reload')
  @ApiBearerAuth('bearer')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async reload() {
    await this.svc.rebuildIndexFromDb();
    return { ok: true, message: 'Índice del chatbot recargado desde la BD' };
  }

  // ==============================================
  // 🩺 Debug search (solo para desarrollo)
  // ==============================================
  @Post('debug')
  @ApiBearerAuth('bearer')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async debugSearch(@Body() dto: BotReplyDto) {
    return this.svc.debugSearch(dto.message);
  }
}