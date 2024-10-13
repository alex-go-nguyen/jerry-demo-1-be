import { Injectable } from '@nestjs/common';

import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';

import { ErrorCode } from '@/common/enums';

import { User } from '@/modules/user/entities/user.entity';
import { Workspace } from '@/modules/workspace/entities/workspace.entity';

import { WorkspaceSharingInvitation } from './entities/sharing-workspace.entity';

import { CreateSharingWorkspaceDto } from './dto/create-sharing-workspace.dto';

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
      const invitation = await this.workspaceSharingInvitationRepository.save({
        owner: workspace.owner,
        workspace: workspace,
        email: email,
        status: 'PENDING',
      });

      const confirmationUrl = `${this.configService.get<string>('WEB_CLIENT_URL')}/confirm-invitation/${invitation.id}`;

      await this.mailerService.sendMail({
        to: email,
        from: 'support@yourapp.com',
        subject: 'Workspace Invitation',
        template: 'invitation_email',
        context: {
          workspaceName: workspace.name,
          ownerName: workspace.owner.name,
          url: confirmationUrl,
        },
      });
      await this.workspaceSharingInvitationRepository.save(invitation);
    }
  }
  async confirmInvitation(inviteId: string) {
    const invitation = await this.workspaceSharingInvitationRepository.findOne({
      where: { id: inviteId },
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

    invitation.status = 'ACCEPTED';
    await this.workspaceSharingInvitationRepository.save(invitation);

    const workspace = await this.workspaceRepository.findOne({
      where: { id: invitation.workspace.id },
      relations: ['members'],
    });

    if (workspace) {
      workspace.members.push(user);
      await this.workspaceRepository.save(workspace);
    }

    return { message: 'Invitation accepted successfully' };
  }
}
