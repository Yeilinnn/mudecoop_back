import { PartialType } from '@nestjs/mapped-types';
import { CreateCoopActivityDto } from './create-coop-activity.dto';

export class UpdateCoopActivityDto extends PartialType(CreateCoopActivityDto) {}
