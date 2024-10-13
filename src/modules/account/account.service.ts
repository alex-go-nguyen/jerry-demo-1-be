import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { Injectable } from '@nestjs/common';

import { ErrorCode } from '@/common/enums';

import { EncryptionService } from '@/encryption/encryption.service';

import { Account } from './entities/account.entity';

import { CreateAccountDto, UpdateAccountDto } from './dto';

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
      user: user.id,
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

  async getAccountByUserIdAndAccountId(
    userId: string,
    accountId: string,
  ): Promise<Account> {
    const account = await this.accountRepository.findOne({
      where: { id: accountId, user: { id: userId } },
      relations: ['user'],
      select: {
        user: { id: true },
      },
    });

    if (!account) {
      throw new Error(ErrorCode.ACCOUNT_NOT_FOUND);
    }

    return account;
  }

  async updateAccount(
    userId: string,
    accountId: string,
    updateAccountData: UpdateAccountDto,
  ) {
    if (
      !updateAccountData.domain ||
      !updateAccountData.username ||
      !updateAccountData.password ||
      !userId ||
      !accountId
    ) {
      throw new Error(ErrorCode.MISSING_INPUT);
    }

    const existedAccount = await this.accountRepository.findOne({
      where: { id: accountId, user: { id: userId } },
      relations: ['user'],
      select: {
        user: { id: true },
      },
    });

    if (!existedAccount) throw new Error(ErrorCode.ACCOUNT_NOT_FOUND);

    existedAccount.domain = updateAccountData.domain;
    existedAccount.username = updateAccountData.username;
    existedAccount.password = this.encryptionService.encryptPassword(
      updateAccountData.password,
    );

    const updatedAccount = await this.accountRepository.save(existedAccount);
    return updatedAccount;
  }
  async softRemove(userId: string, accountId: string) {
    if (!userId || !accountId) {
      throw new Error(ErrorCode.MISSING_INPUT);
    }

    const existedAccount = await this.accountRepository.findOne({
      where: { id: accountId, user: { id: userId } },
      relations: ['user'],
      select: {
        user: { id: true },
      },
    });

    if (!existedAccount) throw new Error(ErrorCode.ACCOUNT_NOT_FOUND);

    await this.accountRepository.softRemove(existedAccount);
  }

  async restore(accountId: string) {
    await this.accountRepository.restore({ id: accountId });
  }
}
