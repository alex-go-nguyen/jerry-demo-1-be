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
import { Workspace } from '@/modules/workspace/entities/workspace.entity';
import { NotificationService } from '@/modules/notification/notification.service';
import { NotificationGateway } from '@/modules/notification/notification.gateway';
import { MemberActivityLogService } from '@/modules/member-activity-log/member-activity-log.service';
import { WorkspacesSharingMembersService } from '@/modules/workspaces-sharing-members/workspaces-sharing-members.service';

import {
  CreateWorkspacesSharingInvitationsDto,
  ConfirmWorkspaceSharingInvitationDto,
} from './dtos';
import { WorkspacesSharingInvitations } from './entities/workspaces-sharing-invitations.entity';

@Injectable()
export class SharingWorkspaceService {
  constructor(
    @InjectRepository(WorkspacesSharingInvitations)
    private workspacesSharingInvitationsRepository: Repository<WorkspacesSharingInvitations>,

    @InjectRepository(Workspace)
    private workspaceRepository: Repository<Workspace>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    private readonly workspacesSharingMembersService: WorkspacesSharingMembersService,

    private readonly notificationService: NotificationService,

    private readonly notificationGateway: NotificationGateway,

    private readonly memberActivityLogService: MemberActivityLogService,

    private readonly configService: ConfigService,

    private readonly mailerService: MailerService,
  ) {}

  async create(
    user: User,
    workspacesSharingInvitationsData: CreateWorkspacesSharingInvitationsDto,
  ) {
    const existedWorkspace = await this.workspaceRepository.findOne({
      where: {
        id: workspacesSharingInvitationsData.workspaceId,
      },
      relations: ['owner', 'members', 'members.member'],
    });

    if (!existedWorkspace) {
      throw new Error(ErrorCode.WORKSPACE_NOT_FOUND);
    }

    const { sharingMembers } = workspacesSharingInvitationsData;

    if (!sharingMembers || sharingMembers.length === 0) {
      throw new Error(ErrorCode.NO_SHARING_MEMBERS_PROVIDED);
    }
    const filteredSharingMembers: CreateWorkspacesSharingInvitationsDto['sharingMembers'] =
      [];
    const membersToUpdate = [];

    if (existedWorkspace.members?.length > 0) {
      sharingMembers.forEach((sharingMember) => {
        const existingMember = existedWorkspace.members.find(
          (existedMember) => existedMember.member.email === sharingMember.email,
        );

        if (existingMember) {
          if (existingMember.roleAccess !== sharingMember.roleAccess) {
            existingMember.roleAccess = sharingMember.roleAccess;
            membersToUpdate.push(existingMember);
          }
        } else {
          filteredSharingMembers.push(sharingMember);
        }
      });
    } else {
      filteredSharingMembers.push(...sharingMembers);
    }

    if (membersToUpdate.length > 0) {
      await this.workspaceRepository.save({
        ...existedWorkspace,
        members: [...existedWorkspace.members],
      });
    }

    if (filteredSharingMembers.length === 0) {
      return;
    }
    const invitations = filteredSharingMembers.map((member) => {
      return this.workspacesSharingInvitationsRepository.create({
        owner: user,
        workspace: existedWorkspace,
        email: member.email,
        roleAccess: member.roleAccess,
        status: StatusInvitation.PENDING,
      });
    });
    const invitationSaved =
      await this.workspacesSharingInvitationsRepository.save(invitations);

    await Promise.all(
      invitationSaved.map(async (invitation) => {
        let confirmationUrl = `${this.configService.get<string>(
          envKeys.WEB_CLIENT_URL,
        )}/confirm-workspace-invitation/${invitation.id}`;

        const notification = await this.notificationService.createNotification({
          receipient: invitation.email,
          sender: user,
          activityType: ActivityType.INVITATION_TO_WORKSPACE,
          workspaceInvitationId: invitation.id,
        });

        if (notification) {
          this.notificationGateway.sendNotification(notification);
          confirmationUrl += `?notificationId=${notification.id}`;
        }

        return this.mailerService.sendMail({
          to: invitation.email,
          from: this.configService.get<string>(envKeys.EMAIL_SENDER),
          subject: 'Workspace Sharing Invitation',
          template: 'invitation_email',
          context: {
            type: 'Workspace',
            itemName: existedWorkspace.name,
            ownerName: existedWorkspace.owner?.name || 'Owner',
            url: confirmationUrl,
          },
        });
      }),
    );

    if (user.id !== existedWorkspace.owner.id) {
      const activityLog = await this.memberActivityLogService.create({
        workspaceId: existedWorkspace.id,
        entityType: EntityType.WORKSPACE,
        action: RoleAccess.MANAGE,
      });

      const notification = await this.notificationService.createNotification({
        receipient: existedWorkspace.owner.email,
        sender: user,
        activityType: ActivityType.MEMBER_SHARE_A_WORKSPACE,
        activityLogId: activityLog.id,
      });

      this.notificationGateway.sendNotification(notification);
    }
  }

  async confirmInvitation(
    confirmSharingWorkspaceData: ConfirmWorkspaceSharingInvitationDto,
  ) {
    const invitation =
      await this.workspacesSharingInvitationsRepository.findOne({
        where: { id: confirmSharingWorkspaceData.inviteId },
        relations: ['workspace', 'workspace.members', 'workspace.accounts'],
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
    await this.workspacesSharingInvitationsRepository.save(invitation);
    return await this.workspacesSharingMembersService.create({
      workspace: invitation.workspace,
      member: user,
      roleAccess: invitation.roleAccess,
    });
  }

  async declineInvitation(inviteId: string) {
    const invitation =
      await this.workspacesSharingInvitationsRepository.findOne({
        where: { id: inviteId },
        relations: ['workspace', 'workspace.members', 'workspace.accounts'],
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
      throw new Error(ErrorCode.INVALID_LINK_EMAIL_VERIFICATION);
    }

    invitation.status = StatusInvitation.DECLINE;
    await this.workspacesSharingInvitationsRepository.save(invitation);
  }
}
