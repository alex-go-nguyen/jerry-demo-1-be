import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CaslModule } from '@/casl/casl.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { User } from '@/modules/user/entities/user.entity';
import { RedisCacheService } from '@/cache/redis-cache.service';
import { AccountModule } from '@/modules/account/account.module';
import { Account } from '@/modules/account/entities/account.entity';
import { NotificationGateway } from '@/modules/notification/notification.gateway';
import { NotificationService } from '@/modules/notification/notification.service';
import { Notification } from '@/modules/notification/entities/notification.entity';
import { MemberActivityLogService } from '@/modules/member-activity-log/member-activity-log.service';
import { NotificationDetailService } from '@/modules/notification-detail/notification-detail.service';
import { MemberActivityLog } from '@/modules/member-activity-log/entities/member-activity-log.entity';
import { NotificationDetail } from '@/modules/notification-detail/entities/notification-detail.entity';
import { AccountsSharingMembersService } from '@/modules/accounts-sharing-members/accounts-sharing-members.service';
import { AccountsSharingMembers } from '@/modules/accounts-sharing-members/entities/accounts-sharing-members.entity';

import { AccountsSharingInvitationsService } from './accounts-sharing-invitations.service';
import { AccountsSharingInvitations } from './entities/accounts-sharing-invitations.entity';
import { AccountsSharingInvitationsController } from './accounts-sharing-invitations.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AccountsSharingInvitations,
      AccountsSharingMembers,
      Account,
      User,
      Notification,
      NotificationDetail,
      MemberActivityLog,
    ]),
    AuthModule,
    CaslModule,
    AccountModule,
  ],
  controllers: [AccountsSharingInvitationsController],
  providers: [
    AccountsSharingInvitationsService,
    AccountsSharingMembersService,
    NotificationService,
    NotificationDetailService,
    NotificationGateway,
    RedisCacheService,
    MemberActivityLogService,
  ],
})
export class AccountsSharingInvitationsModule {}
