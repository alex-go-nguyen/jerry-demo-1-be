import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CaslModule } from '@/casl/casl.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { AccountModule } from '@/modules/account/account.module';
import { AccountsSharingMembersModule } from '@/modules/accounts-sharing-members/accounts-sharing-members.module';

import { AccountVersionService } from './account-version.service';
import { AccountVersion } from './entities/account-version.entity';
import { AccountVersionController } from './account-version.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([AccountVersion]),
    AuthModule,
    CaslModule,
    AccountsSharingMembersModule,
    AccountModule,
  ],
  controllers: [AccountVersionController],
  providers: [AccountVersionService],
  exports: [AccountVersionService],
})
export class AccountVersionModule {}
