import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Gallery } from './entities/gallery.entity';
import { GalleryImage } from './entities/gallery-image.entity';
import { GalleryService } from './gallery.service';
import { GalleryAdminController } from './gallery.admin.controller';
import { GalleryPublicController } from './gallery.public.controller';
import { StorageService } from '../common/storage/storage.service';

@Module({
  imports: [TypeOrmModule.forFeature([Gallery, GalleryImage])],
  controllers: [GalleryAdminController, GalleryPublicController],
  providers: [GalleryService, StorageService],
})
export class GalleryModule {}
