import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Faq } from './entities/faq.entity';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { ChatbotService } from 'src/chatbot/chatbot.service';

@Injectable()
export class FaqService {
  constructor(
    @InjectRepository(Faq)
    private readonly faqRepo: Repository<Faq>,

    @Inject(forwardRef(() => ChatbotService))
    private readonly chatbotService: ChatbotService,
  ) {}

  async create(dto: CreateFaqDto) {
    const faq = this.faqRepo.create(dto);
    const saved = await this.faqRepo.save(faq);
    await this.chatbotService.rebuildIndexFromDb();
    return saved;
  }

  async findAll() {
    return this.faqRepo.find({ order: { displayOrder: 'ASC', id: 'DESC' } });
  }

  async findOne(id: number) {
    const faq = await this.faqRepo.findOne({ where: { id } });
    if (!faq) throw new NotFoundException(`FAQ #${id} no encontrada`);
    return faq;
  }

  async update(id: number, dto: UpdateFaqDto) {
    const faq = await this.findOne(id);
    Object.assign(faq, dto);
    const updated = await this.faqRepo.save(faq);
    await this.chatbotService.rebuildIndexFromDb();
    return updated;
  }

  async remove(id: number) {
    const faq = await this.findOne(id);
    await this.faqRepo.remove(faq);
    await this.chatbotService.rebuildIndexFromDb();
    return { deleted: true };
  }
}
