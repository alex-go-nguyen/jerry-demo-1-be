import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '@/modules/auth/auth.module';

import { UserTwoFaService } from './user-twofa.service';
import { UserTwoFa } from './entities/user-two-fa.entity';
import { UserTwoFaController } from './user-twofa.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserTwoFa]), AuthModule],
  controllers: [UserTwoFaController],
  providers: [UserTwoFaService],
})
export class TwoFactorAuthModule {}
