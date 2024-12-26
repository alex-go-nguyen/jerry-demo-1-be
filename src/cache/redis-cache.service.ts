import Redis from 'ioredis';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RedisCacheService {
  private redisClient: Redis;

  constructor() {
    this.redisClient = new Redis({
      host: process.env.REDIS_HOST,
      port: +process.env.REDIS_PORT,
    });
  }

  async saveSocketConnection(email: string, socketId: string): Promise<void> {
    await this.redisClient.set(`socket:${email}`, socketId);
  }

  async removeSocketConnection(email: string): Promise<void> {
    await this.redisClient.del(`socket:${email}`);
  }

  async getSocketIdByEmail(email: string): Promise<string | null> {
    return this.redisClient.get(`socket:${email}`);
  }

  async saveAccessToken(userId: string, accessToken: string) {
    return await this.redisClient.setex(`userId:${userId}`, 3600, accessToken);
  }

  async getAccessToken(userId: string) {
    return this.redisClient.get(`userId:${userId}`);
  }

  async saveSecretTwoFa(userId: string, secret: string) {
    return this.redisClient.setex(`secret:${userId}`, 300, secret);
  }

  async getSecretTwoFa(userId: string) {
    return this.redisClient.get(`secret:${userId}`);
  }

  async saveSkipTwoFa(userId: string) {
    const EXPIRED_SKIP_TIME = 1800;
    return this.redisClient.setex(
      `isSkippedTwoFa-${userId}`,
      EXPIRED_SKIP_TIME,
      'true',
    );
  }

  async getSkipTwoFa(userId: string) {
    return this.redisClient.get(`isSkippedTwoFa-${userId}`);
  }
}
