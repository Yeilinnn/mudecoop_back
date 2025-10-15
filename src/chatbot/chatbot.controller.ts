import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { BotReplyDto } from './dto/reply.dto';

@Controller('bot')
export class ChatbotController {
  constructor(private readonly svc: ChatbotService) {}

  @Get('health')
  health() {
    return this.svc.health();
  }

  @Get('faqs')
  getFaqs() {
    return this.svc.getFaqs('es');
  }

  @Post('reply')
  @HttpCode(HttpStatus.OK)
  async reply(@Body() dto: BotReplyDto) {
    const res = await this.svc.reply(dto.message, dto.lang ?? 'es');
    return res;
  }
}
