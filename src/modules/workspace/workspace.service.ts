import { In, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { ErrorCode } from '@/common/enums';
import { User } from '@/modules/user/entities/user.entity';
import { Account } from '@/modules/account/entities/account.entity';
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
  ) {}
  async create(createWorkspaceDto: CreateWorkspaceDto) {
    const { name, userId, accounts: accountIds } = createWorkspaceDto;

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

  async getWorkspacesByUserId(userId: string) {
    const workspaces = await this.workspaceRepository.find({
      where: [
        { owner: { id: userId } },
        { members: { member: { id: userId } } },
      ],
      relations: ['owner', 'members', 'accounts', 'members.member'],
      select: {
        id: true,
        name: true,
        owner: { id: true, name: true, email: true, avatar: true },
        accounts: { id: true, domain: true, username: true, password: true },
        members: {
          roleAccess: true,
          member: { id: true, name: true, email: true, avatar: true },
        },
      },
    });
    return workspaces.map((workspace) => ({
      ...workspace,
      members: workspace.members.map((member) => ({
        id: member.member.id,
        name: member.member.name,
        email: member.member.email,
        avatar: member.member.avatar,
        roleAccess: member.roleAccess,
      })),
    }));
  }

  async update(updateWorkspaceDto: UpdateWorkspaceDto) {
    const {
      workspaceId,
      name,
      userId,
      accounts: accountIds,
    } = updateWorkspaceDto;

    const existedWorkspace = await this.workspaceRepository.findOne({
      where: [
        { id: workspaceId },
        { owner: { id: userId } },
        { members: { member: { id: userId } } },
      ],
      relations: ['owner', 'accounts', 'members'],
    });

    if (!existedWorkspace) {
      throw new Error(ErrorCode.WORKSPACE_NOT_FOUND);
    }

    const currentAccountIds = existedWorkspace.accounts.map(
      (account) => account.id,
    );

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

    const removedAccountIds = currentAccountIds.filter(
      (accountId) => !accountIds.includes(accountId),
    );

    const newAccountIds = accountIds.filter(
      (id) => !currentAccountIds.includes(id),
    );

    const newAccounts = await this.accountRepository.find({
      where: { id: In(newAccountIds) },
    });

    existedWorkspace.accounts = [
      ...existedWorkspace.accounts.filter(
        (account) => !removedAccountIds.includes(account.id),
      ),
      ...newAccounts,
    ];

    existedWorkspace.name = name;

    await this.workspaceRepository.save(existedWorkspace);

    await this.workspacesSharingMembersService.updateAccountsSharingFromWorkspace(
      { workspaceId, newAccountIds, removedAccountIds },
    );
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
