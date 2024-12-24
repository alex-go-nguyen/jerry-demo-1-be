import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CaslModule } from '@/casl/casl.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { AccountModule } from '@/modules/account/account.module';

import { AccountsSharingMembersService } from './accounts-sharing-members.service';
import { AccountsSharingMembers } from './entities/accounts-sharing-members.entity';
import { AccountsSharingMembersController } from './accounts-sharing-members.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([AccountsSharingMembers]),
    AuthModule,
    CaslModule,
    AccountModule,
  ],
  controllers: [AccountsSharingMembersController],
  providers: [AccountsSharingMembersService],
  exports: [AccountsSharingMembersService],
})
export class AccountsSharingMembersModule {}
