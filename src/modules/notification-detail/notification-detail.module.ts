import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { NotificationDetailService } from './notification-detail.service';
import { NotificationDetail } from './entities/notification-detail.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationDetail])],
  controllers: [],
  providers: [NotificationDetailService],
  exports: [NotificationDetailService],
})
export class NotificationDetailModule {}
