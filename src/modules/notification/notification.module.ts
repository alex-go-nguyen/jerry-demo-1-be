import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '@/modules/auth/auth.module';
import { RedisCacheService } from '@/cache/redis-cache.service';
import { NotificationDetailService } from '@/modules/notification-detail/notification-detail.service';
import { NotificationDetail } from '@/modules/notification-detail/entities/notification-detail.entity';

import { NotificationService } from './notification.service';
import { NotificationGateway } from './notification.gateway';
import { Notification } from './entities/notification.entity';
import { NotificationController } from './notification.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, NotificationDetail]),
    AuthModule,
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationDetailService,
    NotificationGateway,
    RedisCacheService,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
