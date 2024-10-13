import { Injectable } from '@nestjs/common';

import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { ErrorCode } from '@/common/enums';

import { User } from '@/modules/user/entities/user.entity';
import { Account } from '@/modules/account/entities/account.entity';

import { Workspace } from './entities/workspace.entity';

import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';

@Injectable()
export class WorkspaceService {
  constructor(
    @InjectRepository(Workspace)
    private workspaceRepository: Repository<Workspace>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
  ) {}
  async create(createWorkspaceDto: CreateWorkspaceDto) {
    const { name, userId, accounts: accountIds } = createWorkspaceDto;
    if (!name || !accountIds) {
      throw new Error(ErrorCode.MISSING_INPUT);
    }
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

    return this.workspaceRepository.save(newWorkspace);
  }

  async getWorkspacesByUserId(userId: string) {
    return await this.workspaceRepository
      .createQueryBuilder('workspace')
      .leftJoinAndSelect('workspace.owner', 'owner')
      .leftJoinAndSelect('workspace.members', 'members')
      .leftJoinAndSelect('workspace.accounts', 'accounts')
      .select([
        'workspace.id',
        'workspace.name',
        'owner.id',
        'owner.name',
        'members.id',
        'members.name',
        'accounts.id',
        'accounts.username',
        'accounts.domain',
        'accounts.password',
      ])
      .where('owner.id = :userId OR members.id = :userId', { userId })
      .andWhere('workspace.deletedAt IS NULL')
      .getMany();
  }

  findOne(id: number) {
    return `This action returns a #${id} workspace`;
  }

  async update(updateWorkspaceDto: UpdateWorkspaceDto) {
    const {
      workspaceId,
      name,
      userId,
      accounts: accountIds,
    } = updateWorkspaceDto;

    if (!workspaceId || !name || !accountIds || accountIds.length === 0) {
      throw new Error(ErrorCode.MISSING_INPUT);
    }

    const owner = await this.userRepository.findOneBy({ id: userId });
    if (!owner) {
      throw new Error(ErrorCode.USER_NOT_FOUND);
    }

    const existedWorkspace = await this.workspaceRepository.findOne({
      where: {
        id: workspaceId,
        owner: { id: userId },
      },
      relations: ['owner', 'accounts'],
    });

    if (!existedWorkspace) {
      throw new Error(ErrorCode.WORKSPACE_NOT_FOUND);
    }

    const accounts = await this.accountRepository.find({
      where: { id: In(accountIds) },
    });

    existedWorkspace.name = name;
    existedWorkspace.accounts = accounts;

    return await this.workspaceRepository.save(existedWorkspace);
  }

  async softRemove(ownerId: string, workspaceId: string) {
    const workspace = await this.workspaceRepository.findOne({
      where: {
        id: workspaceId,
        owner: { id: ownerId },
      },
      relations: ['owner'],
    });

    if (!workspace) {
      throw new Error(ErrorCode.WORKSPACE_NOT_FOUND);
    }

    await this.workspaceRepository.softRemove(workspace);
  }

  async restore(workspaceId: string) {
    await this.workspaceRepository.restore({ id: workspaceId });
  }
}
