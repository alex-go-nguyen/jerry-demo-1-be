import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CaslModule } from '@/casl/casl.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { User } from '@/modules/user/entities/user.entity';
import { EncryptionService } from '@/encryption/encryption.service';
import { AccountsSharingMembersService } from '@/modules/accounts-sharing-members/accounts-sharing-members.service';
import { AccountsSharingMembers } from '@/modules/accounts-sharing-members/entities/accounts-sharing-members.entity';

import { AccountService } from './account.service';
import { Account } from './entities/account.entity';
import { AccountController } from './account.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Account, User, AccountsSharingMembers]),
    AuthModule,
    CaslModule,
  ],
  providers: [AccountService, EncryptionService, AccountsSharingMembersService],
  controllers: [AccountController],
  exports: [AccountService],
})
export class AccountModule {}
