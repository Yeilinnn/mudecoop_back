import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Faq } from './entities/faq.entity';

@Injectable()
export class FaqPublicService {
  constructor(
    @InjectRepository(Faq)
    private readonly faqRepo: Repository<Faq>,
  ) {}

  /**
   * 🔹 Listar FAQs visibles, ordenadas por displayOrder
   */
  async findVisible() {
    return this.faqRepo.find({
      where: { isVisible: true },
      order: { displayOrder: 'ASC', id: 'ASC' },
    });
  }
}
