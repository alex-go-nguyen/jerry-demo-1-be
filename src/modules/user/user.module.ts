import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '@/modules/auth/auth.module';
import { RedisCacheService } from '@/cache/redis-cache.service';

import { UsersService } from './user.service';
import { User } from './entities/user.entity';
import { UsersController } from './user.controller';
@Module({
  imports: [TypeOrmModule.forFeature([User]), AuthModule],
  controllers: [UsersController],
  providers: [UsersService, RedisCacheService],
})
export class UsersModule {}
