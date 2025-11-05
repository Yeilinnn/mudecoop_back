import { IsBoolean } from 'class-validator';

export class UpdateSettingDto {
  @IsBoolean()
  isEnabled: boolean;
}
