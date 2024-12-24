import { Inject, Injectable } from '@nestjs/common';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class RedisCacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async saveSocketConnection(email: string, socketId: string): Promise<void> {
    await this.cacheManager.set(`socket:${email}`, socketId);
  }

  async removeSocketConnection(email: string): Promise<void> {
    await this.cacheManager.del(`socket:${email}`);
  }

  async getSocketIdByEmail(email: string): Promise<string | null> {
    return this.cacheManager.get(`socket:${email}`);
  }

  async saveAccessToken(userId: string, accessToken: string) {
    return await this.cacheManager.set(`userId:${userId}`, accessToken, 3600);
  }

  async getAccessToken(userId: string) {
    return this.cacheManager.get(`userId:${userId}`);
  }

  async saveSecretTwoFa(userId: string, secret: string) {
    return this.cacheManager.set(`secret:${userId}`, secret, 300);
  }

  async getSecretTwoFa(userId: string) {
    return this.cacheManager.get(`secret:${userId}`);
  }

  async saveSkipTwoFa(userId: string) {
    const EXPIRED_SKIP_TIME = 1800;
    return this.cacheManager.set(
      `isSkippedTwoFa-${userId}`,
      'true',
      EXPIRED_SKIP_TIME,
    );
  }

  async getSkipTwoFa(userId: string) {
    return this.cacheManager.get(`isSkippedTwoFa-${userId}`);
  }
}
