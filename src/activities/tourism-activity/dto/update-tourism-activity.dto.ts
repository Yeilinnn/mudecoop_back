import { PartialType } from '@nestjs/mapped-types';
import { CreateTourismActivityDto } from './create-tourism-activity.dto';

export class UpdateTourismActivityDto extends PartialType(CreateTourismActivityDto) {}
