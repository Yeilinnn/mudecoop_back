// src/cms/dto/update-section-visibility.dto.ts
import { IsBoolean } from 'class-validator';
export class UpdateSectionVisibilityDto {
  @IsBoolean()
  isVisible: boolean;
}
