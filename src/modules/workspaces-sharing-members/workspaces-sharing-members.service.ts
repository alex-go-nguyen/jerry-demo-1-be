import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { ErrorCode } from '@/common/enums';
import { Injectable } from '@nestjs/common';
import { AccountsSharingMembersService } from '@/modules/accounts-sharing-members/accounts-sharing-members.service';
import { AccountsSharingMembers } from '@/modules/accounts-sharing-members/entities/accounts-sharing-members.entity';

import {
  CreateWorkspaceSharingMemberDto,
  UpdateWorkspaceSharingMemberDto,
} from './dtos';
import { WorkspacesSharingMembers } from './entities/workspaces-sharing-members.entity';

@Injectable()
export class WorkspacesSharingMembersService {
  constructor(
    @InjectRepository(WorkspacesSharingMembers)
    private workspacesSharingMembersRepository: Repository<WorkspacesSharingMembers>,

    @InjectRepository(AccountsSharingMembers)
    private accountsSharingMembersRepository: Repository<AccountsSharingMembers>,

    private readonly accountsSharingMembersService: AccountsSharingMembersService,
  ) {}
  async create(workspaceSharingMemberData: CreateWorkspaceSharingMemberDto) {
    const {
      workspace: { accounts },
      member,
      roleAccess,
    } = workspaceSharingMemberData;
    await this.workspacesSharingMembersRepository.save(
      workspaceSharingMemberData,
    );

    const accountSharingMemberPromises = accounts.map((account) =>
      this.accountsSharingMembersService.create({
        account,
        member,
        roleAccess,
      }),
    );

    await Promise.all(accountSharingMemberPromises);
  }

  async getWorkspacesByMember(memberId: string) {
    return await this.workspacesSharingMembersRepository.find({
      where: {
        memberId,
      },
    });
  }

  async updateRoleAccess(
    workspaceSharingMemberData: UpdateWorkspaceSharingMemberDto,
  ) {
    const { workspaceId, ownerId, sharingMembers } = workspaceSharingMemberData;

    if (!sharingMembers || sharingMembers.length === 0) {
      throw new Error(ErrorCode.NO_SHARING_MEMBERS_PROVIDED);
    }

    const existedSharingMembers =
      await this.workspacesSharingMembersRepository.find({
        where: { workspaceId },
        relations: ['member'],
      });
    if (sharingMembers.length !== existedSharingMembers.length) {
      const incomingMemberIds = sharingMembers.map((member) => member.id);

      const membersToDelete = existedSharingMembers.filter(
        (existedSharingMember) =>
          !incomingMemberIds.includes(existedSharingMember.member.id),
      );

      const deleteMemberPromises = membersToDelete.map((memberToDelete) =>
        this.workspacesSharingMembersRepository.delete({
          workspaceId,
          member: { id: memberToDelete.member.id },
        }),
      );
      await Promise.all(deleteMemberPromises);
    }

    const updateMemberPromises = sharingMembers.map((sharingMember) =>
      this.workspacesSharingMembersRepository
        .update(
          {
            workspaceId,
            member: { id: sharingMember.id },
          },
          {
            roleAccess: sharingMember.roleAccess,
          },
        )
        .then((result) => {
          if (result.affected === 0) {
            throw new Error(
              `${ErrorCode.MEMBER_NOT_FOUND}: Member ID ${sharingMember.id} not found in workspace ${workspaceId}`,
            );
          }
        }),
    );
    await Promise.all(updateMemberPromises);

    const {
      workspace: { accounts: workspaceAccounts },
    } = await this.workspacesSharingMembersRepository.findOne({
      where: { workspace: { id: workspaceId } },
      relations: ['workspace', 'workspace.accounts'],
    });

    const syncAccountRolePromises = workspaceAccounts.map((account) =>
      this.accountsSharingMembersService.updateRoleAccess({
        accountId: account.id,
        ownerId,
        sharingMembers,
      }),
    );
    await Promise.all(syncAccountRolePromises);
  }

  async updateAccountsSharingFromWorkspace({
    workspaceId,
    newAccountIds,
    removedAccountIds,
  }: {
    workspaceId: string;
    newAccountIds: string[];
    removedAccountIds: string[];
  }) {
    const workspaceMembers = await this.workspacesSharingMembersRepository.find(
      {
        where: { workspaceId },
        relations: ['member'],
      },
    );

    const workspaceMemberIds = workspaceMembers.map(
      (member) => member.member.id,
    );

    if (removedAccountIds.length > 0) {
      await this.accountsSharingMembersRepository.delete({
        accountId: In(removedAccountIds),
        memberId: In(workspaceMemberIds),
      });
    }

    if (newAccountIds.length > 0) {
      const newSharingMembers = newAccountIds.flatMap((accountId) =>
        workspaceMembers.map((member) => ({
          accountId,
          memberId: member.member.id,
          roleAccess: member.roleAccess,
        })),
      );

      await this.accountsSharingMembersRepository.save(newSharingMembers);
    }
  }
}
