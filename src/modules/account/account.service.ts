import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { Injectable } from '@nestjs/common';

import { ErrorCode } from '@/common/enums';

import { EncryptionService } from '@/encryption/encryption.service';

import { Account } from './entities/account.entity';

import { CreateAccountDto } from './dto/create-account.dto';

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    private readonly encryptionService: EncryptionService,
  ) {}

  async createAccountService(user, createAccountData: CreateAccountDto) {
    if (
      !createAccountData.domain ||
      !createAccountData.username ||
      !createAccountData.password
    ) {
      throw new Error(ErrorCode.MISSING_INPUT);
    }

    const encryptedPassword = this.encryptionService.encryptPassword(
      createAccountData.password,
    );

    const newAccount = this.accountRepository.create({
      user: user.us_id,
      domain: createAccountData.domain,
      username: createAccountData.username,
      password: encryptedPassword,
    });

    const savedAccount = await this.accountRepository.save(newAccount);
    return savedAccount;
  }
  async getAccountsByUserId(userId: string): Promise<Account[]> {
    const listAccounts = await this.accountRepository.find({
      where: { user: { id: userId } },
      relations: ['user'],
      select: {
        user: { id: true },
      },
    });
    return listAccounts;
  }
}
