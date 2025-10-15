import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import type { LangCode } from '../types';

export class BotReplyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  message!: string;

  @IsOptional()
  @IsIn(['es', 'es-cr'])
  lang?: LangCode = 'es';
}
