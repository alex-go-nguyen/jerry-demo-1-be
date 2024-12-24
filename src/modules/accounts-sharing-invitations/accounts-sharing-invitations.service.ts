import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { MailerService } from '@nestjs-modules/mailer';

import {
  ActivityType,
  EntityType,
  ErrorCode,
  RoleAccess,
  StatusInvitation,
} from '@/common/enums';
import { envKeys } from '@/utils/constants';
import { User } from '@/modules/user/entities/user.entity';
import { Account } from '@/modules/account/entities/account.entity';
import { NotificationService } from '@/modules/notification/notification.service';
import { NotificationGateway } from '@/modules/notification/notification.gateway';
import { MemberActivityLogService } from '@/modules/member-activity-log/member-activity-log.service';
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

    private readonly notificationService: NotificationService,

    private readonly notificationGateway: NotificationGateway,

    private readonly memberActivityLogService: MemberActivityLogService,

    private readonly configService: ConfigService,

    private readonly mailerService: MailerService,
  ) {}

  async create(
    user: User,
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
        owner: user,
        account: existedAccount,
        email: member.email,
        roleAccess: member.roleAccess,
        status: StatusInvitation.PENDING,
      });
    });
    const invitationSaved =
      await this.accountsSharingInvitationsRepository.save(invitations);

    await Promise.all(
      invitationSaved.map(async (invitation) => {
        let confirmationUrl = `${this.configService.get<string>(
          envKeys.WEB_CLIENT_URL,
        )}/confirm-account-invitation/${invitation.id}`;

        const notification = await this.notificationService.createNotification({
          receipient: invitation.email,
          sender: user,
          activityType: ActivityType.SHARE_AN_ACCOUNT,
          accountInvitationId: invitation.id,
        });

        if (notification) {
          this.notificationGateway.sendNotification(notification);
          confirmationUrl += `?notificationId=${notification.id}`;
        }

        return this.mailerService.sendMail({
          to: invitation.email,
          from: this.configService.get<string>(envKeys.EMAIL_SENDER),
          subject: 'Account Sharing Invitation',
          template: 'invitation_email',
          context: {
            type: 'Account',
            itemName: existedAccount.username,
            ownerName: user.name || 'Owner',
            url: confirmationUrl,
          },
        });
      }),
    );

    if (user.id !== existedAccount.owner.id) {
      const activityLog = await this.memberActivityLogService.create({
        accountId: existedAccount.id,
        entityType: EntityType.ACCOUNT,
        action: RoleAccess.MANAGE,
      });

      const notification = await this.notificationService.createNotification({
        receipient: existedAccount.owner.email,
        sender: user,
        activityType: ActivityType.MEMBER_SHARE_AN_ACCOUNT,
        activityLogId: activityLog.id,
      });

      this.notificationGateway.sendNotification(notification);
    }
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

    if (invitation.status !== StatusInvitation.PENDING) {
      throw new Error(ErrorCode.INVALID_LINK_CONFIRM_INVITATION);
    }

    const user = await this.userRepository.findOne({
      where: { email: invitation.email },
    });

    if (!user) {
      throw new Error(ErrorCode.USER_NOT_FOUND);
    }

    invitation.status = StatusInvitation.ACCEPTED;
    await this.accountsSharingInvitationsRepository.save(invitation);
    return await this.accountsSharingMembersService.create({
      account: invitation.account,
      member: user,
      roleAccess: invitation.roleAccess,
    });
  }

  async declineInvitation(inviteId: string) {
    const invitation = await this.accountsSharingInvitationsRepository.findOne({
      where: { id: inviteId },
      relations: ['account', 'owner'],
    });

    if (!invitation) {
      throw new Error(ErrorCode.INVITATION_NOT_FOUND);
    }

    if (invitation.status !== StatusInvitation.PENDING) {
      throw new Error(ErrorCode.INVALID_LINK_CONFIRM_INVITATION);
    }

    const user = await this.userRepository.findOne({
      where: { email: invitation.email },
    });

    if (!user) {
      throw new Error(ErrorCode.USER_NOT_FOUND);
    }

    invitation.status = StatusInvitation.DECLINE;
    await this.accountsSharingInvitationsRepository.save(invitation);
  }
}
