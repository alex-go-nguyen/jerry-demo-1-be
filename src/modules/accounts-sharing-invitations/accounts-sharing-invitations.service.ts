import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { MailerService } from '@nestjs-modules/mailer';

import { envKeys } from '@/utils/constants';
import { User } from '@/modules/user/entities/user.entity';
import { ErrorCode, StatusInvitation } from '@/common/enums';
import { Account } from '@/modules/account/entities/account.entity';
import { AccountsSharingMembersService } from '@/modules/accounts-sharing-members/accounts-sharing-members.service';

import {
  ConfirmSharingAccounntDto,
  CreateAccountsSharingInvitationsDto,
} from './dtos';
import { AccountsSharingInvitations } from './entities/accounts-sharing-invitations.entity';

@Injectable()
export class AccountsSharingInvitationsService {
  constructor(
    @InjectRepository(AccountsSharingInvitations)
    private accountsSharingInvitationsRepository: Repository<AccountsSharingInvitations>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Account)
    private accountRepository: Repository<Account>,

    private readonly accountsSharingMembersService: AccountsSharingMembersService,
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
  ) {}

  async create(
    ownerId: string,
    accountsSharingInvitationsData: CreateAccountsSharingInvitationsDto,
  ) {
    const existedAccount = await this.accountRepository.findOne({
      where: { id: accountsSharingInvitationsData.accountId },
      relations: ['owner', 'members', 'members.member'],
    });

    if (!existedAccount) {
      throw new Error(ErrorCode.ACCOUNT_NOT_FOUND);
    }

    const { sharingMembers } = accountsSharingInvitationsData;

    if (!sharingMembers || sharingMembers.length === 0) {
      throw new Error(ErrorCode.NO_SHARING_MEMBERS_PROVIDED);
    }

    const filteredSharingMembers: CreateAccountsSharingInvitationsDto['sharingMembers'] =
      [];
    const membersToUpdate = [];

    if (existedAccount.members?.length > 0) {
      sharingMembers.forEach((member) => {
        const existingMember = existedAccount.members.find(
          (existedMember) => existedMember.member.email === member.email,
        );

        if (existingMember) {
          if (existingMember.roleAccess !== member.roleAccess) {
            existingMember.roleAccess = member.roleAccess;
            membersToUpdate.push(existingMember);
          }
        } else {
          filteredSharingMembers.push(member);
        }
      });
    } else {
      filteredSharingMembers.push(...sharingMembers);
    }

    if (membersToUpdate.length > 0) {
      await this.accountRepository.save({
        ...existedAccount,
        members: [...existedAccount.members],
      });
    }

    if (filteredSharingMembers.length === 0) {
      return;
    }

    const invitations = filteredSharingMembers.map((member) => {
      return this.accountsSharingInvitationsRepository.create({
        owner: { id: ownerId },
        account: existedAccount,
        email: member.email,
        roleAccess: member.roleAccess,
        status: StatusInvitation.PENDING,
      });
    });
    const invitationSaved =
      await this.accountsSharingInvitationsRepository.save(invitations);

    await Promise.all(
      invitationSaved.map((invitation) => {
        const confirmationUrl = `${this.configService.get<string>(
          envKeys.WEB_CLIENT_URL,
        )}/confirm-account-invitation/${invitation.id}`;

        return this.mailerService.sendMail({
          to: invitation.email,
          from: this.configService.get<string>(envKeys.EMAIL_SENDER),
          subject: 'Account Sharing Invitation',
          template: 'invitation_email',
          context: {
            type: 'Account',
            itemName: existedAccount.username,
            ownerName: existedAccount.owner?.name || 'Owner',
            url: confirmationUrl,
          },
        });
      }),
    );
  }
  async confirmInvitation(
    confirmSharingWorkspaceData: ConfirmSharingAccounntDto,
  ) {
    const invitation = await this.accountsSharingInvitationsRepository.findOne({
      where: { id: confirmSharingWorkspaceData.inviteId },
      relations: ['account', 'owner'],
    });

    if (!invitation) {
      throw new Error(ErrorCode.INVITATION_NOT_FOUND);
    }

    const user = await this.userRepository.findOne({
      where: { email: invitation.email },
    });

    if (!user) {
      throw new Error(ErrorCode.USER_NOT_FOUND);
    }

    if (invitation.status === StatusInvitation.ACCEPTED) {
      throw new Error(ErrorCode.INVALID_LINK_CONFIRM_INVITATION);
    }

    invitation.status = StatusInvitation.ACCEPTED;
    await this.accountsSharingInvitationsRepository.save(invitation);
    return await this.accountsSharingMembersService.create({
      account: invitation.account,
      member: user,
      roleAccess: invitation.roleAccess,
    });
  }
}
