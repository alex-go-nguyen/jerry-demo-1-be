import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CaslModule } from '@/casl/casl.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { User } from '@/modules/user/entities/user.entity';
import { RedisCacheService } from '@/cache/redis-cache.service';
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
import { WorkspacesSharingMembersService } from '@/modules/workspaces-sharing-members/workspaces-sharing-members.service';
import { WorkspacesSharingMembers } from '@/modules/workspaces-sharing-members/entities/workspaces-sharing-members.entity';

import { WorkspaceService } from './workspace.service';
import { Workspace } from './entities/workspace.entity';
import { WorkspaceController } from './workspace.controller';
import { SubscriptionPlan } from '@/modules/subscriptions/entities/subscription-plan.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Workspace,
      User,
      Account,
      WorkspacesSharingMembers,
      AccountsSharingMembers,
      Notification,
      NotificationDetail,
      MemberActivityLog,
      SubscriptionPlan,
    ]),
    AuthModule,
    CaslModule,
  ],
  controllers: [WorkspaceController],
  providers: [
    WorkspaceService,
    WorkspacesSharingMembersService,
    AccountsSharingMembersService,
    NotificationService,
    NotificationDetailService,
    NotificationGateway,
    RedisCacheService,
    MemberActivityLogService,
  ],
  exports: [WorkspaceService],
})
export class WorkspaceModule {}
