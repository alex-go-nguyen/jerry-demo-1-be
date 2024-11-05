import Redis from 'ioredis';
import { Repository } from 'typeorm';
import { TABLES } from '@/utils/constants';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ErrorCode, Role, StatusTwoFa } from '@/common/enums';

import { User } from './entities/user.entity';
import { UpdateUserDto } from './dtos/update-user.dto';

@Injectable()
export class UsersService {
  private redisClient: Redis;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    this.redisClient = new Redis();
  }
  async getUsers(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const data = await this.userRepository
      .createQueryBuilder(TABLES.user)
      .leftJoin('user.accounts', 'accounts')
      .select([
        'user.id AS id',
        'user.name AS name',
        'user.email AS email',
        'user.isAuthenticated AS isAuthenticated',
        'user.deletedAt AS deleted',
        'COUNT(DISTINCT accounts.id) AS accountsCount',
      ])
      .where('user.role = :role', { role: Role.User })
      .withDeleted()
      .groupBy('user.id')
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
      relations: ['userTwoFa'],
    });
    const {
      id,
      name,
      role,
      email,
      avatar,
      phoneNumber,
      userTwoFa: { status },
    } = existedUser;

    const isSkippedTwoFa =
      status === StatusTwoFa.NOT_REGISTERED
        ? await this.redisClient.get(`isSkippedTwoFa-${id}`)
        : false;

    return {
      id,
      name,
      role,
      email,
      avatar,
      status,
      phoneNumber,
      isSkippedTwoFa,
    };
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
    const EXPIRED_SKIP_TIME = 1800;
    return await this.redisClient.setex(
      `isSkippedTwoFa-${userId}`,
      EXPIRED_SKIP_TIME,
      'true',
    );
  }
}
