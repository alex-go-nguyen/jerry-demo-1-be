import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { MailerService } from '@nestjs-modules/mailer';

import { envKeys } from '@/utils/constants';
import { User } from '@/modules/user/entities/user.entity';
import { ErrorCode, StatusInvitation } from '@/common/enums';
import { Workspace } from '@/modules/workspace/entities/workspace.entity';
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
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
  ) {}
  async create(
    ownerId: string,
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
        owner: { id: ownerId },
        workspace: existedWorkspace,
        email: member.email,
        roleAccess: member.roleAccess,
        status: StatusInvitation.PENDING,
      });
    });
    const invitationSaved =
      await this.workspacesSharingInvitationsRepository.save(invitations);

    await Promise.all(
      invitationSaved.map((invitation) => {
        const confirmationUrl = `${this.configService.get<string>(
          envKeys.WEB_CLIENT_URL,
        )}/confirm-workspace-invitation/${invitation.id}`;

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
      throw new Error(ErrorCode.INVALID_LINK_EMAIL_VERIFICATION);
    }

    invitation.status = StatusInvitation.ACCEPTED;
    await this.workspacesSharingInvitationsRepository.save(invitation);
    return await this.workspacesSharingMembersService.create({
      workspace: invitation.workspace,
      member: user,
      roleAccess: invitation.roleAccess,
    });
  }
}
