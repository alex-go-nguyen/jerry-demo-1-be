import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { ErrorCode } from '@/common/enums';
import { Injectable } from '@nestjs/common';
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
    const encryptedPassword = this.encryptionService.encryptPassword(
      createAccountData.password,
    );

    const newAccount = this.accountRepository.create({
      owner: user.id,
      domain: createAccountData.domain,
      username: createAccountData.username,
      password: encryptedPassword,
    });

    await this.accountRepository.save(newAccount);
  }

  async checkOwner(ownerId: string, accountId: string): Promise<boolean> {
    const account = await this.accountRepository.findOne({
      where: { id: accountId, owner: { id: ownerId } },
      relations: ['owner'],
    });
    return !!account;
  }

  async getAccountsByUserId(userId: string) {
    const accounts = await this.accountRepository.find({
      where: [
        { owner: { id: userId } },
        { members: { member: { id: userId } } },
      ],
      relations: ['owner', 'members', 'members.member'],
      select: {
        id: true,
        domain: true,
        username: true,
        password: true,
        owner: { id: true, name: true, email: true, avatar: true },
        members: {
          roleAccess: true,
          member: { id: true, name: true, email: true, avatar: true },
        },
      },
    });
    return accounts.map((account) => ({
      ...account,
      members: account.members.map((member) => ({
        id: member.member.id,
        name: member.member.name,
        email: member.member.email,
        avatar: member.member.avatar,
        roleAccess: member.roleAccess,
      })),
    }));
  }

  async getAccountById(accountId: string) {
    const account = await this.accountRepository.findOne({
      where: { id: accountId },
      relations: ['owner', 'members', 'members.member'],
      select: {
        id: true,
        domain: true,
        username: true,
        password: true,
        owner: { id: true, name: true, email: true, avatar: true },
      },
    });

    if (!account) {
      throw new Error(ErrorCode.ACCOUNT_NOT_FOUND);
    }

    return {
      ...account,
      members: account.members.map((member) => ({
        id: member.member.id,
        name: member.member.name,
        email: member.member.email,
        avatar: member.member.avatar,
        roleAccess: member.roleAccess,
      })),
    };
  }

  async updateAccount(
    userId: string,
    accountId: string,
    updateAccountData: UpdateAccountDto,
  ) {
    const existedAccount = await this.accountRepository.findOne({
      where: [
        {
          id: accountId,
        },
        { owner: { id: userId } },
        { members: { member: { id: userId } } },
      ],
      relations: ['owner', 'members'],
    });

    if (!existedAccount) throw new Error(ErrorCode.ACCOUNT_NOT_FOUND);

    const encryptedPassword = this.encryptionService.encryptPassword(
      updateAccountData.password,
    );

    return await this.accountRepository.update(accountId, {
      domain: updateAccountData.domain,
      username: updateAccountData.username,
      password: encryptedPassword,
    });
  }
  async softRemove(userId: string, accountId: string) {
    const existedAccount = await this.accountRepository.findOne({
      where: { id: accountId, owner: { id: userId } },
      relations: ['owner'],
      select: {
        owner: { id: true },
      },
    });

    if (!existedAccount) throw new Error(ErrorCode.ACCOUNT_NOT_FOUND);

    await this.accountRepository.softRemove(existedAccount);
  }

  async restore(accountId: string) {
    await this.accountRepository.restore({ id: accountId });
  }
}
