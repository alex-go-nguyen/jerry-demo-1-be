import * as dayjs from 'dayjs';
import { Injectable } from '@nestjs/common';
import { Between, In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { MailerService } from '@nestjs-modules/mailer';

import { User } from '@/modules/user/entities/user.entity';

import { CreateLoginHistoryDto } from './dtos';
import { LoginHistory } from './entities/login-history.entity';

@Injectable()
export class LoginHistoryService {
  constructor(
    @InjectRepository(LoginHistory)
    private readonly loginHistoryRepository: Repository<LoginHistory>,

    private readonly mailerService: MailerService,
  ) {}

  async create(user: User, createLoginHistoryData: CreateLoginHistoryDto) {
    const newLoginHistory = this.loginHistoryRepository.create({
      user,
      ...createLoginHistoryData,
    });

    const userLoginHistory = await this.loginHistoryRepository.find({
      where: { user: { id: user.id } },
    });

    const deviceIds = userLoginHistory.map((history) => history.deviceId);

    const { loginTime, userAgent, ipAddress } =
      await this.loginHistoryRepository.save(newLoginHistory);

    if (!deviceIds.includes(createLoginHistoryData.deviceId)) {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Warning email',
        template: 'warning_email',
        context: {
          fullName: user.name,
          loginTime,
          userAgent,
          ipAddress,
        },
      });
    }
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
