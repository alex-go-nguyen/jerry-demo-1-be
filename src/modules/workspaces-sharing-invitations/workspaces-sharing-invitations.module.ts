import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CaslModule } from '@/casl/casl.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { User } from '@/modules/user/entities/user.entity';
import { RedisCacheService } from '@/cache/redis-cache.service';
import { Account } from '@/modules/account/entities/account.entity';
import { WorkspaceModule } from '@/modules/workspace/workspace.module';
import { WorkspaceService } from '@/modules/workspace/workspace.service';
import { Workspace } from '@/modules/workspace/entities/workspace.entity';
import { NotificationGateway } from '@/modules/notification/notification.gateway';
import { NotificationService } from '@/modules/notification/notification.service';
import { Notification } from '@/modules/notification/entities/notification.entity';
import { MemberActivityLogModule } from '@/modules/member-activity-log/member-activity-log.module';
import { NotificationDetailService } from '@/modules/notification-detail/notification-detail.service';
import { NotificationDetail } from '@/modules/notification-detail/entities/notification-detail.entity';
import { AccountsSharingMembersService } from '@/modules/accounts-sharing-members/accounts-sharing-members.service';
import { AccountsSharingMembers } from '@/modules/accounts-sharing-members/entities/accounts-sharing-members.entity';
import { WorkspacesSharingMembersService } from '@/modules/workspaces-sharing-members/workspaces-sharing-members.service';
import { WorkspacesSharingMembers } from '@/modules/workspaces-sharing-members/entities/workspaces-sharing-members.entity';

import { SharingWorkspaceService } from './workspaces-sharing-invitations.service';
import { SharingWorkspaceController } from './workspaces-sharing-invitations.controller';
import { WorkspacesSharingInvitations } from './entities/workspaces-sharing-invitations.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Workspace,
      User,
      Account,
      WorkspacesSharingInvitations,
      WorkspacesSharingMembers,
      AccountsSharingMembers,
      Notification,
      NotificationDetail,
    ]),
    AuthModule,
    WorkspaceModule,
    CaslModule,
    MemberActivityLogModule,
  ],
  controllers: [SharingWorkspaceController],
  providers: [
    SharingWorkspaceService,
    WorkspacesSharingMembersService,
    AccountsSharingMembersService,
    WorkspaceService,
    NotificationService,
    NotificationDetailService,
    NotificationGateway,
    RedisCacheService,
  ],
})
export class SharingWorkspaceModule {}
