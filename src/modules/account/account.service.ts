import { Brackets, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import {
  ActivityType,
  EntityType,
  ErrorCode,
  RoleAccess,
} from '@/common/enums';
import { TABLES } from '@/utils/constants';
import { Injectable } from '@nestjs/common';
import { User } from '@/modules/user/entities/user.entity';
import { EncryptionService } from '@/encryption/encryption.service';
import { NotificationService } from '@/modules/notification/notification.service';
import { NotificationGateway } from '@/modules/notification/notification.gateway';
import { AccountVersionService } from '@/modules/account-version/account-version.service';
import { MemberActivityLogService } from '@/modules/member-activity-log/member-activity-log.service';

import { Account } from './entities/account.entity';
import { CreateAccountDto, UpdateAccountDto } from './dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';

export type CheckOwnerParams = {
  ownerId: string;
  accountId: string;
};

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,

    private readonly encryptionService: EncryptionService,

    private readonly memberActivityLogService: MemberActivityLogService,

    private readonly notificationService: NotificationService,

    private readonly notificationGateway: NotificationGateway,

    private readonly accountVersionService: AccountVersionService,
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

  async checkOwner({ ownerId, accountId }: CheckOwnerParams): Promise<boolean> {
    const account = await this.accountRepository.findOne({
      where: { id: accountId, owner: { id: ownerId } },
    });
    return !!account;
  }

  async getAccountsByUserId(userId: string, query: PaginationQueryDto) {
    const { page, limit, keyword } = query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    const skip = (pageNumber - 1) * limitNumber;

    const queryBuilder = this.accountRepository
      .createQueryBuilder(TABLES.account)
      .leftJoinAndSelect('account.owner', 'owner')
      .leftJoinAndSelect('account.members', 'members')
      .leftJoinAndSelect('members.member', 'member');

    if (keyword) {
      queryBuilder.where(
        '(account.username ILIKE :keyword OR account.domain ILIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    queryBuilder
      .andWhere(
        new Brackets((qb) => {
          qb.where('owner.id = :userId', { userId }).orWhere(
            'member.id = :userId',
            { userId },
          );
        }),
      )
      .skip(skip)
      .take(limitNumber);

    const [accounts, totalCount] = await queryBuilder.getManyAndCount();

    const totalPages = Math.ceil(totalCount / limitNumber);

    const formattedAccounts = accounts.map((account) => ({
      ...account,
      members: account.members.map((member) => ({
        id: member.member.id,
        name: member.member.name,
        email: member.member.email,
        avatar: member.member.avatar,
        roleAccess: member.roleAccess,
      })),
    }));

    return {
      accounts: formattedAccounts,
      totalPages,
      itemsPerPage: limitNumber,
    };
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
    user: User,
    accountId: string,
    updateAccountData: UpdateAccountDto,
  ) {
    const existedAccount = await this.accountRepository.findOne({
      where: {
        id: accountId,
      },
      relations: ['owner', 'members'],
    });

    if (!existedAccount) throw new Error(ErrorCode.ACCOUNT_NOT_FOUND);

    const encryptedPassword = this.encryptionService.encryptPassword(
      updateAccountData.password,
    );

    await this.accountRepository.update(accountId, {
      domain: updateAccountData.domain,
      username: updateAccountData.username,
      password: encryptedPassword,
    });

    await this.accountVersionService.create({
      domain: existedAccount.domain,
      username: existedAccount.username,
      password: existedAccount.password,
      accountId,
      actorId: user.id,
    });

    if (user.id !== existedAccount.owner.id) {
      const activityLog = await this.memberActivityLogService.create({
        accountId: existedAccount.id,
        entityType: EntityType.ACCOUNT,
        action: RoleAccess.UPDATE,
      });
      const notification = await this.notificationService.createNotification({
        receipient: existedAccount.owner.email,
        sender: user,
        activityType: ActivityType.UPDATE_AN_ACCOUNT,
        activityLogId: activityLog.id,
      });

      this.notificationGateway.sendNotification(notification);
    }
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

  async rollbackToVersion(ownerId: string, versionId: string) {
    const accountVersion = await this.accountVersionService.findOne(
      versionId,
      ownerId,
    );
    if (!accountVersion) {
      throw new Error(ErrorCode.ACCOUNT_VERSION_NOT_FOUND);
    }
    await this.accountRepository.update(accountVersion.account.id, {
      domain: accountVersion.domain,
      username: accountVersion.username,
      password: accountVersion.password,
    });

    await this.accountVersionService.remove(versionId, ownerId);
  }

  async restore(accountId: string) {
    await this.accountRepository.restore({ id: accountId });
  }
}
