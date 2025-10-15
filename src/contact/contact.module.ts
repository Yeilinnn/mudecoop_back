import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ContactInfo } from './entities/contact-info.entity';
import { ContactService } from './contact.service';
import { ContactAdminController } from './contact.admin.controller';
import { ContactPublicController } from './contact.public.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ContactInfo])],
  providers: [ContactService],
  controllers: [ContactAdminController, ContactPublicController],
  exports: [ContactService],
})
export class ContactModule {}
