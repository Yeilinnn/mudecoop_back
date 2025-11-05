import { PartialType } from '@nestjs/mapped-types';
import { CreateFaqDto } from './create-faq.dto';
import { IsOptional, IsArray } from 'class-validator';

export class UpdateFaqDto extends PartialType(CreateFaqDto) {
  @IsOptional()
  @IsArray()
  tags?: string[];
}
