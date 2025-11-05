import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { Faq } from '../faqs/entities/faq.entity';
import { FaqModule } from '../faqs/faq.module';
import { ChatbotSetting } from './entities/chatbot-setting.entity';
import { ChatbotMessage } from './entities/chatbot-message.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Faq, ChatbotSetting, ChatbotMessage]),
    forwardRef(() => FaqModule),
  ],
  controllers: [ChatbotController],
  providers: [ChatbotService],
  exports: [ChatbotService],
})
export class ChatbotModule {}
