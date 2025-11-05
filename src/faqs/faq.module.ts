import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FaqService } from './faq.service';
import { FaqController } from './faq.controller';
import { Faq } from './entities/faq.entity';
import { ChatbotModule } from 'src/chatbot/chatbot.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Faq]),
    forwardRef(() => ChatbotModule),
  ],
  controllers: [FaqController],
  providers: [FaqService],
  exports: [FaqService],
})
export class FaqModule {}
