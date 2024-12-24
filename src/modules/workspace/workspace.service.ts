import { Brackets, In, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import {
  ActivityType,
  EntityType,
  ErrorCode,
  RoleAccess,
} from '@/common/enums';
import { TABLES } from '@/utils/constants';
import { User } from '@/modules/user/entities/user.entity';
import { Account } from '@/modules/account/entities/account.entity';
import { PaginationQueryDto } from '@/modules/account/dto/pagination-query.dto';
import { NotificationGateway } from '@/modules/notification/notification.gateway';
import { NotificationService } from '@/modules/notification/notification.service';
import { MemberActivityLogService } from '@/modules/member-activity-log/member-activity-log.service';
import { AccountsSharingMembers } from '@/modules/accounts-sharing-members/entities/accounts-sharing-members.entity';
import { WorkspacesSharingMembersService } from '@/modules/workspaces-sharing-members/workspaces-sharing-members.service';
import { WorkspacesSharingMembers } from '@/modules/workspaces-sharing-members/entities/workspaces-sharing-members.entity';

import { Workspace } from './entities/workspace.entity';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';

export type CheckOwnerParams = {
  ownerId: string;
  workspaceId: string;
};

@Injectable()
export class WorkspaceService {
  constructor(
    @InjectRepository(Workspace)
    private workspaceRepository: Repository<Workspace>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Account)
    private accountRepository: Repository<Account>,

    @InjectRepository(WorkspacesSharingMembers)
    private workspacesSharingMembersRepository: Repository<WorkspacesSharingMembers>,

    @InjectRepository(AccountsSharingMembers)
    private accountsSharingMembersRepository: Repository<AccountsSharingMembers>,

    private readonly workspacesSharingMembersService: WorkspacesSharingMembersService,

    private readonly memberActivityLogService: MemberActivityLogService,

    private readonly notificationService: NotificationService,

    private readonly notificationGateway: NotificationGateway,
  ) {}

  async create(userId: string, createWorkspaceData: CreateWorkspaceDto) {
    const { name, accounts: accountIds } = createWorkspaceData;

    const owner = await this.userRepository.findOneBy({ id: userId });

    if (!owner) {
      throw new Error(ErrorCode.USER_NOT_FOUND);
    }

    const accounts = await this.accountRepository.find({
      where: { id: In(accountIds) },
    });

    const newWorkspace = this.workspaceRepository.create({
      name,
      owner,
      accounts,
    });

    await this.workspaceRepository.save(newWorkspace);
  }

  async checkOwner({
    ownerId,
    workspaceId,
  }: CheckOwnerParams): Promise<boolean> {
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId, owner: { id: ownerId } },
    });
    return !!workspace;
  }

  async findOne(workspaceId: string) {
    const workspace = await this.workspaceRepository.findOne({
      where: {
        id: workspaceId,
      },
      relations: ['owner', 'members', 'accounts', 'members.member'],
      select: {
        id: true,
        name: true,
        createdAt: true,
        owner: { id: true, name: true, email: true, avatar: true },
      },
    });
    if (!workspace) {
      throw new Error(ErrorCode.WORKSPACE_NOT_FOUND);
    }
    return {
      ...workspace,
      members: workspace.members.map((member) => ({
        id: member.member.id,
        name: member.member.name,
        email: member.member.email,
        avatar: member.member.avatar,
        roleAccess: member.roleAccess,
      })),
    };
  }

  async getWorkspacesByUserId(userId: string, query: PaginationQueryDto) {
    const { page, limit, keyword } = query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    const skip = (pageNumber - 1) * limitNumber;

    const queryBuilder = this.workspaceRepository
      .createQueryBuilder(TABLES.workspace)
      .leftJoinAndSelect('workspace.owner', 'owner')
      .leftJoinAndSelect('workspace.members', 'members')
      .leftJoinAndSelect('members.member', 'member')
      .leftJoinAndSelect('workspace.accounts', 'accounts');

    if (keyword) {
      queryBuilder.where('workspace.name ILIKE :keyword', {
        keyword: `%${keyword}%`,
      });
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

    const [workspaces, totalCount] = await queryBuilder.getManyAndCount();

    const totalPages = Math.ceil(totalCount / limitNumber);

    const formattedWorkspaces = workspaces.map((workspace) => ({
      ...workspace,
      members: workspace.members.map((member) => ({
        id: member.member.id,
        name: member.member.name,
        email: member.member.email,
        avatar: member.member.avatar,
        roleAccess: member.roleAccess,
      })),
    }));

    return {
      workspaces: formattedWorkspaces,
      totalPages,
      itemsPerPage: limitNumber,
    };
  }

  async update(
    workspaceId: string,
    user: User,
    updateWorkspaceData: UpdateWorkspaceDto,
  ) {
    const { name, accounts: accountIds } = updateWorkspaceData;

    const existedWorkspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
      relations: ['owner', 'accounts', 'members'],
    });

    if (!existedWorkspace) {
      throw new Error(ErrorCode.WORKSPACE_NOT_FOUND);
    }

    const currentAccountIds = existedWorkspace.accounts.map(
      (account) => account.id,
    );

    existedWorkspace.name = name;

    if (!accountIds || accountIds.length === 0) {
      existedWorkspace.accounts = [];
      await this.workspaceRepository.save(existedWorkspace);
      await this.workspacesSharingMembersService.updateAccountsSharingFromWorkspace(
        {
          workspaceId,
          newAccountIds: [],
          removedAccountIds: currentAccountIds,
        },
      );
      return;
    }
    const { newAccountIds, removedAccountIds } = accountIds.reduce(
      (acc, accountId) => {
        if (!currentAccountIds.includes(accountId)) {
          acc.newAccountIds.push(accountId);
        }
        return acc;
      },
      {
        newAccountIds: [],
        removedAccountIds: currentAccountIds.filter(
          (accountId) => !accountIds.includes(accountId),
        ),
      },
    );
    const newAccounts = await this.accountRepository.find({
      where: { id: In(newAccountIds) },
      relations: ['owner'],
    });

    existedWorkspace.accounts = [
      ...existedWorkspace.accounts.filter(
        (account) => !removedAccountIds.includes(account.id),
      ),
      ...newAccounts,
    ];

    await this.workspaceRepository.save(existedWorkspace);

    await this.workspacesSharingMembersService.updateAccountsSharingFromWorkspace(
      { workspaceId, newAccountIds, removedAccountIds, userId: user.id },
    );

    if (user.id !== existedWorkspace.owner.id) {
      const accountsNotOwnedByOwner = newAccounts.filter(
        (account) => account.owner.id !== existedWorkspace.owner.id,
      );

      if (accountsNotOwnedByOwner.length > 0) {
        for (const account of accountsNotOwnedByOwner) {
          await this.accountsSharingMembersRepository.save({
            account,
            member: existedWorkspace.owner,
            roleAccess: RoleAccess.READ,
          });
        }
      }

      const activityLog = await this.memberActivityLogService.create({
        workspaceId: existedWorkspace.id,
        entityType: EntityType.WORKSPACE,
        action: RoleAccess.UPDATE,
      });

      const notification = await this.notificationService.createNotification({
        receipient: existedWorkspace.owner.email,
        sender: user,
        activityType: ActivityType.UPDATE_AN_WORKSPACE,
        activityLogId: activityLog.id,
      });

      this.notificationGateway.sendNotification(notification);
    }
  }

  async softRemove(ownerId: string, workspaceId: string) {
    const workspace = await this.workspaceRepository.findOne({
      where: {
        id: workspaceId,
        owner: { id: ownerId },
      },
      relations: ['owner', 'members', 'accounts', 'members.member'],
    });

    if (!workspace) {
      throw new Error(ErrorCode.WORKSPACE_NOT_FOUND);
    }

    const accountIds = workspace.accounts.map((account) => account.id);

    const memberIds = workspace.members.map((member) => member.member.id);

    await this.workspacesSharingMembersRepository.delete({ workspaceId });

    if (accountIds.length > 0) {
      await this.accountsSharingMembersRepository.delete({
        accountId: In(accountIds),
        memberId: In(memberIds),
      });
    }

    await this.workspaceRepository.softRemove(workspace);
  }

  async restore(workspaceId: string) {
    await this.workspaceRepository.restore({ id: workspaceId });
  }
}
