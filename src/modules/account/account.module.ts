import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CaslModule } from '@/casl/casl.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { User } from '@/modules/user/entities/user.entity';
import { RedisCacheService } from '@/cache/redis-cache.service';
import { EncryptionService } from '@/encryption/encryption.service';
import { NotificationService } from '@/modules/notification/notification.service';
import { NotificationGateway } from '@/modules/notification/notification.gateway';
import { Notification } from '@/modules/notification/entities/notification.entity';
import { AccountVersionService } from '@/modules/account-version/account-version.service';
import { AccountVersion } from '@/modules/account-version/entities/account-version.entity';
import { MemberActivityLogService } from '@/modules/member-activity-log/member-activity-log.service';
import { MemberActivityLog } from '@/modules/member-activity-log/entities/member-activity-log.entity';
import { NotificationDetailService } from '@/modules/notification-detail/notification-detail.service';
import { NotificationDetail } from '@/modules/notification-detail/entities/notification-detail.entity';
import { AccountsSharingMembersService } from '@/modules/accounts-sharing-members/accounts-sharing-members.service';
import { AccountsSharingMembers } from '@/modules/accounts-sharing-members/entities/accounts-sharing-members.entity';

import { AccountService } from './account.service';
import { Account } from './entities/account.entity';
import { AccountController } from './account.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Account,
      User,
      AccountsSharingMembers,
      MemberActivityLog,
      Notification,
      NotificationDetail,
      AccountVersion,
    ]),
    AuthModule,
    CaslModule,
  ],
  providers: [
    AccountService,
    EncryptionService,
    AccountsSharingMembersService,
    MemberActivityLogService,
    NotificationService,
    NotificationDetailService,
    NotificationGateway,
    RedisCacheService,
    AccountVersionService,
  ],
  controllers: [AccountController],
  exports: [AccountService],
})
export class AccountModule {}
