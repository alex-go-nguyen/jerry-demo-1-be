import { LRUCache } from 'lru-cache';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { User } from '@/modules/user/entities/user.entity';
import { RedisCacheService } from '@/cache/redis-cache.service';
import { UserTwoFaService } from '@/modules/user-twofa/user-twofa.service';
import { UserTwoFa } from '@/modules/user-twofa/entities/user-two-fa.entity';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SubscriptionPlan } from '@/modules/subscriptions/entities/subscription-plan.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserTwoFa, SubscriptionPlan]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        global: true,
        secret: configService.get<string>('JWT_SECRET'),
      }),
    }),
  ],
  providers: [
    AuthService,
    UserTwoFaService,
    {
      provide: LRUCache,
      useFactory: () => {
        return new LRUCache<string, string>({
          max: 500,
          maxSize: 5000,
          ttl: 1000 * 60 * 5,
          sizeCalculation: () => 1,
        });
      },
    },
    RedisCacheService,
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
