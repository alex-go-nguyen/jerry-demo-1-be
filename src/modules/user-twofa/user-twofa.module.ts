import { Module } from '@nestjs/common';
import { UserTwoFaService } from './user-twofa.service';
import { UserTwoFaController } from './user-twofa.controller';

@Module({
  controllers: [UserTwoFaController],
  providers: [UserTwoFaService],
})
export class TwoFactorAuthModule {}
