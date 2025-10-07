// src/cms/cms.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PageSection } from './entities/page-section.entity';
import { ContentBlock } from './entities/content-block.entity';
import { CmsService } from './cms.service';
import { CmsAdminController } from './controllers/cms-admin.controller';
import { CmsPublicController } from './controllers/cms-public.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PageSection, ContentBlock])],
  controllers: [CmsAdminController, CmsPublicController],
  providers: [CmsService],
  exports: [CmsService],
})
export class CmsModule {}
