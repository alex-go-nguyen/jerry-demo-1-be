import { Injectable } from '@nestjs/common';

import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { ErrorCode, Role } from '@/common/enums';

import { User } from './entities/user.entity';
import { UpdateUserDto } from './dtos/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}
  async getUsers(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const data = await this.userRepository
      .createQueryBuilder('user')
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
      .createQueryBuilder('user')
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
    if (profileData.email === '' || profileData.name === '') {
      throw new Error(ErrorCode.MISSING_INPUT);
    }
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
    return await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'name', 'email', 'avatar', 'role', 'phoneNumber'],
    });
  }

  async deactivateUser(userId: string) {
    if (userId === '') {
      throw new Error(ErrorCode.MISSING_INPUT);
    }
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
}
