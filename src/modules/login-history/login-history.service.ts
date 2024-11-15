import { In, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { User } from '@/modules/user/entities/user.entity';

import { CreateLoginHistoryDto } from './dtos';
import { LoginHistory } from './entities/login-history.entity';

@Injectable()
export class LoginHistoryService {
  constructor(
    @InjectRepository(LoginHistory)
    private readonly loginHistoryRepository: Repository<LoginHistory>,
  ) {}

  async create(user: User, createLoginHistoryData: CreateLoginHistoryDto) {
    const newLoginHistory = this.loginHistoryRepository.create({
      user,
      ...createLoginHistoryData,
    });

    return await this.loginHistoryRepository.save(newLoginHistory);
  }

  async findAll(user: User) {
    return await this.loginHistoryRepository.find({
      where: {
        user: { id: user.id },
      },
      order: {
        loginTime: 'desc',
      },
    });
  }

  async bulkSoftDelete(user: User, loginHistoryIds: string[]) {
    return await this.loginHistoryRepository.delete({
      id: In(loginHistoryIds),
      user: { id: user.id },
    });
  }
}
