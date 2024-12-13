import * as dayjs from 'dayjs';
import { Injectable } from '@nestjs/common';
import { Between, In, Repository } from 'typeorm';
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

  async findAll(user: User, { startDate, endDate, skip }) {
    const formattedStartDate = dayjs(startDate, 'MM-DD-YYYY')
      .startOf('day')
      .toDate();
    const formattedEndDate = dayjs(endDate, 'MM-DD-YYYY').endOf('day').toDate();
    return await this.loginHistoryRepository.find({
      where: {
        user: { id: user.id },
        loginTime: Between(formattedStartDate, formattedEndDate),
      },
      order: {
        loginTime: 'desc',
      },
      skip,
      take: 10,
    });
  }

  async bulkSoftDelete(user: User, loginHistoryIds: string[]) {
    return await this.loginHistoryRepository.delete({
      id: In(loginHistoryIds),
      user: { id: user.id },
    });
  }
}
