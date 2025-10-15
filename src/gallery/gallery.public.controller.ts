import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GalleryService } from './gallery.service';

@ApiTags('Galería (PUBLIC)')
@Controller('public/gallery')
export class GalleryPublicController {
  constructor(private readonly svc: GalleryService) {}

  @Get()
  @ApiOperation({ summary: 'Listar galerías activas (para landing, sin auth)' })
  async listActiveGalleries() {
    // Sólo activas para la web pública
    return this.svc.listGalleries({ active: true });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener galería pública (solo imágenes visibles)' })
  async getPublicGallery(@Param('id', ParseIntPipe) id: number) {
    // Reutilizamos el método admin y filtramos las imágenes no visibles
    const g = await this.svc.getGalleryWithImages(id);
    return {
      id: g.id,
      title: g.title,
      description: g.description,
      layout: g.layout,
      isActive: g.isActive,
      images: (g as any).images?.filter((img: any) => !!img.isVisible) ?? [],
    };
  }
}
