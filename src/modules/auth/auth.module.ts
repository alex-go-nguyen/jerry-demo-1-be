import { Module } from '@nestjs/common';

import { JwtModule } from '@nestjs/jwt';

import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { LRUCache } from 'lru-cache';

import { UserTwoFaService } from '@/modules/user-twofa/user-twofa.service';

import { TwoFactorAuthModule } from '@/modules/user-twofa/user-twofa.module';

import { User } from '@/modules/user/entities/user.entity';
import { UserTwoFa } from '@/modules/user-twofa/entities/user-two-fa.entity';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserTwoFa]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        global: true,
        secret: configService.get<string>('JWT_SECRET'),
      }),
    }),
    TwoFactorAuthModule,
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
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
