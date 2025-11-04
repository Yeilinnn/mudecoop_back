import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoopActivity } from './coop-activity/coop-activity.entity';
import { CoopActivityBlock } from './coop-activity/coop-activity-block.entity';
import { ActivityReservation } from '../activity-reservation/entities/activity-reservation.entity';
import { ActivityContact } from '../activities/activity-contact/activity-contact.entity';
import { TourismActivity } from './tourism-activity/tourism-activity.entity';
import { TourismActivityBlock } from './tourism-activity/tourism-activity-block.entity';

import { CoopActivityService } from './coop-activity/coop-activity.service';
import { TourismActivityService } from './tourism-activity/tourism-activity.service';
import { ActivityContactService } from '../activities/activity-contact/activity-contact.service';
import { CoopActivityController } from './coop-activity/coop-activity.controller';
import { TourismActivityController } from './tourism-activity/tourism-activity.controller';
import { ActivityContactController } from '../activities/activity-contact/activity-contact.controller';

import { NotificationsModule } from 'src/notifications/notifications.module'; // ✅ Import agregado

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CoopActivity,
      CoopActivityBlock,
      ActivityReservation,
      ActivityContact,
      TourismActivity,
      TourismActivityBlock,
    ]),
    forwardRef(() => NotificationsModule), // ✅ Esto inyecta correctamente NotificationsService
  ],
  controllers: [
    CoopActivityController,
    TourismActivityController,
    ActivityContactController,
  ],
  providers: [
    CoopActivityService,
    TourismActivityService,
    ActivityContactService,
  ],
  exports: [
    CoopActivityService,
    TourismActivityService,
    ActivityContactService,
  ],
})
export class ActivityModule {}
