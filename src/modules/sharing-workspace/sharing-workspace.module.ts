import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '@/modules/auth/auth.module';

import { Workspace } from '@/modules/workspace/entities/workspace.entity';
import { User } from '@/modules/user/entities/user.entity';

import { SharingWorkspaceService } from './sharing-workspace.service';
import { SharingWorkspaceController } from './sharing-workspace.controller';
import { WorkspaceSharingInvitation } from './entities/sharing-workspace.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkspaceSharingInvitation, Workspace, User]),
    AuthModule,
  ],

  controllers: [SharingWorkspaceController],
  providers: [SharingWorkspaceService],
})
export class SharingWorkspaceModule {}
