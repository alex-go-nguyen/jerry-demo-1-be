import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '@/modules/auth/auth.module';

import { HighLevelPasswordService } from './high-level-password.service';
import { HighLevelPassword } from './entities/high-level-password.entity';
import { HighLevelPasswordController } from './high-level-password.controller';

@Module({
  imports: [TypeOrmModule.forFeature([HighLevelPassword]), AuthModule],
  controllers: [HighLevelPasswordController],
  providers: [HighLevelPasswordService],
})
export class HighLevelPasswordModule {}
