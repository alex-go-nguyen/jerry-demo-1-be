import { Not, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { ErrorCode } from '@/common/enums';

import { UpdateAccountSharingMemberDto } from './dtos';
import { AccountsSharingMembers } from './entities/accounts-sharing-members.entity';
import { CreateAccountSharingMemberDto } from './dtos/create-account-sharing-member.dto';

@Injectable()
export class AccountsSharingMembersService {
  constructor(
    @InjectRepository(AccountsSharingMembers)
    private accountsSharingMembersRepository: Repository<AccountsSharingMembers>,
  ) {}

  async create(accountSharingMemberData: CreateAccountSharingMemberDto) {
    return this.accountsSharingMembersRepository.save(accountSharingMemberData);
  }

  async getAccountsByMember(memberId: string) {
    return this.accountsSharingMembersRepository.find({
      where: {
        memberId,
      },
    });
  }

  async updateRoleAccess(
    accountSharingMemberData: UpdateAccountSharingMemberDto,
  ) {
    const { accountId, sharingMembers } = accountSharingMemberData;

    const existedSharingMembers =
      await this.accountsSharingMembersRepository.find({
        where: { account: { id: accountId } },
        relations: ['member'],
      });
    if (sharingMembers.length !== existedSharingMembers.length) {
      const incomingMemberIds = sharingMembers.map((member) => member.id);

      const membersToDelete = existedSharingMembers.filter(
        (existedSharingMember) =>
          !incomingMemberIds.includes(existedSharingMember.member.id),
      );

      const deleteMemberPromises = membersToDelete.map((memberToDelete) =>
        this.accountsSharingMembersRepository.delete({
          account: { id: accountId },
          member: { id: memberToDelete.member.id },
        }),
      );
      await Promise.all(deleteMemberPromises);
    }

    const updateMemberPromises = sharingMembers.map((sharingMember) =>
      this.accountsSharingMembersRepository
        .update(
          {
            account: { id: accountId, owner: { id: Not(sharingMember.id) } },
            member: { id: sharingMember.id },
          },
          {
            roleAccess: sharingMember.roleAccess,
          },
        )
        .catch(() => {
          throw new Error(
            `${ErrorCode.MEMBER_NOT_FOUND}: Member ID ${sharingMember.id} not found in account ${accountId}`,
          );
        }),
    );
    await Promise.all(updateMemberPromises);
  }
}
