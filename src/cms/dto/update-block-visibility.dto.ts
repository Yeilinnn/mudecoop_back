// src/cms/dto/update-block-visibility.dto.ts
import { IsBoolean } from 'class-validator';
export class UpdateBlockVisibilityDto {
  @IsBoolean()
  isActive: boolean;
}
