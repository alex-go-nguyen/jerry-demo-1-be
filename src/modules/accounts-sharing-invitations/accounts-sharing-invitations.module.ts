import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CaslModule } from '@/casl/casl.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { User } from '@/modules/user/entities/user.entity';
import { AccountModule } from '@/modules/account/account.module';
import { Account } from '@/modules/account/entities/account.entity';
import { AccountsSharingMembers } from '@/modules/accounts-sharing-members/entities/accounts-sharing-members.entity';
import { AccountsSharingMembersService } from '@/modules/accounts-sharing-members/accounts-sharing-members.service';

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
    ]),
    AuthModule,
    CaslModule,
    AccountModule,
  ],
  controllers: [AccountsSharingInvitationsController],
  providers: [AccountsSharingInvitationsService, AccountsSharingMembersService],
})
export class AccountsSharingInvitationsModule {}
