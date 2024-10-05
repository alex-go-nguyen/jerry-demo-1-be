import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from '@/common/enums';
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
        'COUNT(accounts.id) AS accountsCount',
      ])
      .where('user.role = :role', { role: Role.User })
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
}
