import { redisStore } from 'cache-manager-redis-yet';
import { Global, Module } from '@nestjs/common';
import {
  CacheModule as NestCacheModule,
  CacheStore,
} from '@nestjs/cache-manager';
import { RedisCacheService } from './redis-cache.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    ConfigModule,
    NestCacheModule.registerAsync({
      useFactory: async (configService: ConfigService) => {
        const store = await redisStore({
          socket: {
            host: configService.get('REDIS_HOST'),
            port: configService.get('REDIS_PORT'),
          },
        });

        return {
          global: true,
          store: store as unknown as CacheStore,
          ttl: 24 * 60 * 60_000, // 3 minutes (milliseconds)
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [RedisCacheService],
  exports: [RedisCacheService],
})
export class CacheModule {}
