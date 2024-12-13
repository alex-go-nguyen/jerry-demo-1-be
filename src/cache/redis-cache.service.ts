import Redis from 'ioredis';

import { Injectable } from '@nestjs/common';

@Injectable()
export class RedisCacheService {
  private redisClient: Redis;

  constructor() {
    this.redisClient = new Redis();
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
}
