import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FaqService } from './faq.service';
import { FaqController } from './faq.controller';
import { Faq } from './entities/faq.entity';
import { ChatbotModule } from 'src/chatbot/chatbot.module';

// 👇 nuevos públicos
import { FaqPublicService } from './faq-public.service';
import { FaqPublicController } from './faq-public.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Faq]),
    forwardRef(() => ChatbotModule),
  ],
  controllers: [FaqController, FaqPublicController],
  providers: [FaqService, FaqPublicService],
  exports: [FaqService, FaqPublicService],
})
export class FaqModule {}
