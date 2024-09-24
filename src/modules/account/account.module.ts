import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '@/modules/auth/auth.module';

import { EncryptionService } from '@/encryption/encryption.service';

import { AccountService } from './account.service';

import { AccountController } from './account.controller';

import { Account } from './entities/account.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Account]), AuthModule],
  providers: [AccountService, EncryptionService],
  controllers: [AccountController],
  exports: [AccountService],
})
export class AccountModule {}
