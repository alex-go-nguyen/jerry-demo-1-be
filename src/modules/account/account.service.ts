import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { Injectable } from '@nestjs/common';

import { ErrorCode } from '@/common/enums';

import { EncryptionService } from '@/encryption/encryption.service';

import { tableNames, tableRelations } from '@/utils/constants';

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
    const encryptedPassword = this.encryptionService.encryptPassword(
      createAccountData.password,
    );

    const newAccount = this.accountRepository.create({
      user: user.id,
      domain: createAccountData.domain,
      username: createAccountData.username,
      password: encryptedPassword,
    });

    await this.accountRepository.save(newAccount);
  }
  async getAccountsByUserId(userId: string): Promise<Account[]> {
    return this.accountRepository
      .createQueryBuilder(tableNames.account)
      .leftJoinAndSelect('account.user', 'user')
      .leftJoin('account.workspaces', 'workspace')
      .leftJoinAndSelect('workspace.members', 'member')
      .where('user.id = :userId', { userId })
      .orWhere('member.id = :userId', { userId })
      .getMany();
  }

  async getAccountByUserIdAndAccountId(
    userId: string,
    accountId: string,
  ): Promise<Account> {
    const account = await this.accountRepository.findOne({
      where: { id: accountId, user: { id: userId } },
      relations: [tableRelations.user],
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
    const existedAccount = await this.accountRepository.findOne({
      where: { id: accountId, user: { id: userId } },
      relations: [tableRelations.user],
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
    const existedAccount = await this.accountRepository.findOne({
      where: { id: accountId, user: { id: userId } },
      relations: [tableRelations.user],
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
