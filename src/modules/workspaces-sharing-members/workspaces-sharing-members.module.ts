import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CaslModule } from '@/casl/casl.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { User } from '@/modules/user/entities/user.entity';
import { RedisCacheService } from '@/cache/redis-cache.service';
import { Account } from '@/modules/account/entities/account.entity';
import { WorkspaceService } from '@/modules/workspace/workspace.service';
import { Workspace } from '@/modules/workspace/entities/workspace.entity';
import { NotificationModule } from '@/modules/notification/notification.module';
import { NotificationGateway } from '@/modules/notification/notification.gateway';
import { MemberActivityLogModule } from '@/modules/member-activity-log/member-activity-log.module';
import { AccountsSharingMembersService } from '@/modules/accounts-sharing-members/accounts-sharing-members.service';
import { AccountsSharingMembers } from '@/modules/accounts-sharing-members/entities/accounts-sharing-members.entity';

import { WorkspacesSharingMembersService } from './workspaces-sharing-members.service';
import { WorkspacesSharingMembers } from './entities/workspaces-sharing-members.entity';
import { WorkspacesSharingMembersController } from './workspaces-sharing-members.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Workspace,
      User,
      Account,
      AccountsSharingMembers,
      WorkspacesSharingMembers,
    ]),
    AuthModule,
    CaslModule,
    MemberActivityLogModule,
    NotificationModule,
  ],
  controllers: [WorkspacesSharingMembersController],
  providers: [
    WorkspacesSharingMembersService,
    AccountsSharingMembersService,
    WorkspaceService,
    NotificationGateway,
    RedisCacheService,
  ],
  exports: [WorkspacesSharingMembersService],
})
export class WorkspacesSharingMembersModule {}
