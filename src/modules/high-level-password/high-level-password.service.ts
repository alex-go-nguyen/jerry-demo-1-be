import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { ErrorCode, StatusTwoFa } from '@/common/enums';

import { HighLevelPassword } from './entities/high-level-password.entity';
import { CreateHighLevelPasswordDto } from './dtos/create-high-level-password.dto';

@Injectable()
export class HighLevelPasswordService {
  constructor(
    @InjectRepository(HighLevelPassword)
    private readonly highLevelPasswordRepository: Repository<HighLevelPassword>,
  ) {}
  async create(
    userId: string,
    createHighLevelPasswordData: CreateHighLevelPasswordDto,
  ) {
    const hashedPassword = await bcrypt.hash(
      createHighLevelPasswordData.password,
      10,
    );

    const newHighLevelPassword = this.highLevelPasswordRepository.create({
      ...createHighLevelPasswordData,
      user: { id: userId },
      password: hashedPassword,
    });
    return await this.highLevelPasswordRepository.save(newHighLevelPassword);
  }

  async verifyHighLevelPassword(userId: string, highLevelPassword: string) {
    const highLevelPasswordData =
      await this.highLevelPasswordRepository.findOne({
        where: {
          user: { id: userId },
        },
      });

    const isCorrectPassword = bcrypt.compareSync(
      highLevelPassword,
      highLevelPasswordData.password,
    );

    if (!isCorrectPassword) {
      throw new Error(ErrorCode.INCORRECT_PASSWORD);
    }

    return isCorrectPassword;
  }

  async toggleHighPassword(userId: string) {
    const existedHighLevelPassword =
      await this.highLevelPasswordRepository.findOne({
        where: {
          user: { id: userId },
        },
      });

    if (!existedHighLevelPassword) {
      throw new Error(ErrorCode.HIGH_LEVEL_PASSWORD_NOT_FOUND);
    }

    if (existedHighLevelPassword.status === StatusTwoFa.DISABLED) {
      existedHighLevelPassword.status = StatusTwoFa.ENABLED;
    } else existedHighLevelPassword.status = StatusTwoFa.DISABLED;

    await this.highLevelPasswordRepository.save(existedHighLevelPassword);
  }
}
