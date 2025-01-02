import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { TABLES } from '@/utils/constants';
import { ErrorCode, Role, StatusTwoFa } from '@/common/enums';
import { RedisCacheService } from '@/cache/redis-cache.service';

import { User } from './entities/user.entity';
import { UpdateUserDto } from './dtos/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,

    private readonly redisCacheService: RedisCacheService,
  ) {}
  async getUsers(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const data = await this.userRepository
      .createQueryBuilder(TABLES.user)
      .leftJoin('user.accounts', 'accounts')
      .leftJoin('user.subscription', 'subscription')
      .select([
        'user.id AS id',
        'user.name AS name',
        'user.email AS email',
        'user.isAuthenticated AS isAuthenticated',
        'user.deletedAt AS deleted',
        'COUNT(DISTINCT accounts.id) AS accountsCount',
        'subscription.name AS subscription',
      ])
      .where('user.role = :role', { role: Role.User })
      .withDeleted()
      .groupBy('user.id, subscription.name')
      .orderBy('user.createdAt', 'DESC')
      .offset(skip)
      .limit(limit)
      .getRawMany();

    const totalCount = await this.userRepository
      .createQueryBuilder(TABLES.user)
      .where('user.role = :role', { role: Role.User })
      .getCount();

    return {
      listUsers: data,
      totalItems: totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
    };
  }
  async updateProfile(profileData: UpdateUserDto) {
    const existedUser = await this.userRepository.findOne({
      where: { email: profileData.email },
    });
    if (!existedUser) {
      throw new Error(ErrorCode.USER_NOT_FOUND);
    } else {
      if (!existedUser.isAuthenticated) {
        throw new Error(ErrorCode.EMAIL_NO_AUTHENTICATED);
      }
      existedUser.name = profileData.name;
      existedUser.avatar = profileData.avatar;
      existedUser.phoneNumber = profileData.phoneNumber;
      await this.userRepository.save(existedUser);
      const { id, name, role, email, avatar, phoneNumber } = existedUser;
      return {
        id,
        name,
        role,
        email,
        avatar,
        phoneNumber,
      };
    }
  }
  async findById(userId: string) {
    const existedUser = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['userTwoFa', 'highLevelPasswords', 'subscription'],
    });
    const {
      id,
      name,
      role,
      email,
      avatar,
      phoneNumber,
      highLevelPasswords,
      subscription,
      userTwoFa: { status },
    } = existedUser;

    const isSkippedTwoFa =
      status === StatusTwoFa.NOT_REGISTERED
        ? await this.redisCacheService.getSkipTwoFa(id)
        : false;
    const returnUser = {
      id,
      name,
      role,
      email,
      avatar,
      status,
      phoneNumber,
      highLevelPasswords: highLevelPasswords.map((highLevelPassword) => ({
        methodSecureId: highLevelPassword.id,
        type: highLevelPassword.type,
        status: highLevelPassword.status,
      })),
      subscriptionDetail: subscription ?? {
        id: subscription?.id,
        name: subscription?.name,
        maxAccounts: subscription?.maxAccounts,
        maxWorkspaces: subscription?.maxWorkspaces,
        weights: subscription?.weights,
      },
      subscription: subscription?.name,
      isSkippedTwoFa,
    };

    return returnUser;
  }
  async findByIdWithRelations(userId: string): Promise<User> {
    return this.userRepository.findOne({
      where: { id: userId },
      relations: [
        'sharedAccounts',
        'sharedAccounts.member',
        'sharedAccounts.account',
      ],
    });
  }
  async deactivateUser(userId: string) {
    const existedUser = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!existedUser) {
      throw new Error(ErrorCode.USER_NOT_FOUND);
    } else {
      await this.userRepository.softRemove(existedUser);
      return existedUser.deletedAt;
    }
  }

  async activeUser(userId: string) {
    await this.userRepository.restore({ id: userId });
  }

  async skipTwoFa(userId: string) {
    await this.redisCacheService.saveSkipTwoFa(userId);
  }
}
