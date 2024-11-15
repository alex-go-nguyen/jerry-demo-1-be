import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '@/modules/auth/auth.module';

import { LoginHistoryService } from './login-history.service';
import { LoginHistory } from './entities/login-history.entity';
import { LoginHistoryController } from './login-history.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LoginHistory]), AuthModule],
  controllers: [LoginHistoryController],
  providers: [LoginHistoryService],
})
export class LoginHistoryModule {}
