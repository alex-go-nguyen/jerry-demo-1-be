import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { MailerService } from '@nestjs-modules/mailer';

import { envKeys } from '@/utils/constants';
import { User } from '@/modules/user/entities/user.entity';
import { ErrorCode, StatusInvitation } from '@/common/enums';
import { Workspace } from '@/modules/workspace/entities/workspace.entity';

import { CreateSharingWorkspaceDto, ConfirmSharingWorkspaceDto } from './dtos';
import { WorkspaceSharingInvitation } from './entities/sharing-workspace.entity';

@Injectable()
export class SharingWorkspaceService {
  constructor(
    @InjectRepository(WorkspaceSharingInvitation)
    private workspaceSharingInvitationRepository: Repository<WorkspaceSharingInvitation>,

    @InjectRepository(Workspace)
    private workspaceRepository: Repository<Workspace>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
  ) {}
  async create(
    ownerId: string,
    createSharingWorkspaceDto: CreateSharingWorkspaceDto,
  ) {
    const workspace = await this.workspaceRepository.findOne({
      where: {
        id: createSharingWorkspaceDto.workspaceId,
        owner: { id: ownerId },
      },
      relations: ['owner'],
    });

    if (!workspace) {
      throw new Error(ErrorCode.WORKSPACE_NOT_FOUND);
    }

    const emailList = createSharingWorkspaceDto.emails;

    for (const email of emailList) {
      const invitation = this.workspaceSharingInvitationRepository.create({
        owner: workspace.owner,
        workspace: workspace,
        email: email,
        status: StatusInvitation.PENDING,
      });

      const invitationSaved =
        await this.workspaceSharingInvitationRepository.save(invitation);
      const confirmationUrl = `${this.configService.get<string>(envKeys.WEB_CLIENT_URL)}/confirm-invitation/${invitationSaved?.id}`;
      await this.mailerService.sendMail({
        to: email,
        from: envKeys.EMAIL_SENDER,
        subject: 'Workspace Invitation',
        template: 'invitation_email',
        context: {
          workspaceName: workspace.name,
          ownerName: workspace.owner.name,
          url: confirmationUrl,
        },
      });
    }
  }
  async confirmInvitation(
    confirmSharingWorkspaceData: ConfirmSharingWorkspaceDto,
  ) {
    const invitation = await this.workspaceSharingInvitationRepository.findOne({
      where: { id: confirmSharingWorkspaceData.inviteId },
      relations: ['workspace'],
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
    await this.workspaceSharingInvitationRepository.save(invitation);

    const workspace = await this.workspaceRepository.findOne({
      where: { id: invitation.workspace.id },
      relations: ['members'],
    });

    if (workspace) {
      workspace.members.push(user);
      await this.workspaceRepository.save(workspace);
    }
  }
}
