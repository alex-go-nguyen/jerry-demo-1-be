import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Patch,
  Param,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';

import { handleDataResponse } from '@/utils';
import { Role, RoleAccess } from '@/common/enums';
import { PoliciesWorkspaceGuard } from '@/guards';
import { AuthGuard } from '@/modules/auth/auth.guard';
import { Roles } from '@/modules/auth/roles.decorator';
import { RolesGuard } from '@/modules/auth/roles.guard';
import { CheckPolicies, CurrentUser } from '@/decorators';
import { User } from '@/modules/user/entities/user.entity';
import { Workspace } from '@/modules/workspace/entities/workspace.entity';

import {
  CreateWorkspacesSharingInvitationsDto,
  ConfirmWorkspaceSharingInvitationDto,
} from './dtos';
import { SharingWorkspaceService } from './workspaces-sharing-invitations.service';

@ApiTags('WorkspaceSharingInvitation')
@Controller('workspaces-sharing')
export class SharingWorkspaceController {
  constructor(
    private readonly sharingWorkspaceService: SharingWorkspaceService,
  ) {}

  @Post('create')
  @Roles(Role.User)
  @UseGuards(AuthGuard, RolesGuard, PoliciesWorkspaceGuard)
  @CheckPolicies((ability) => ability.can(RoleAccess.MANAGE, Workspace))
  @ApiCreatedResponse({
    description: 'Invite to workspace successfully!',
  })
  async create(
    @Body() createSharingWorkspaceDto: CreateWorkspacesSharingInvitationsDto,
    @CurrentUser() user: User,
  ) {
    try {
      await this.sharingWorkspaceService.create(
        user,
        createSharingWorkspaceDto,
      );
      return handleDataResponse('Invite members successfully', 'OK');
    } catch (error) {
      throw error;
    }
  }

  @Post('confirm-invitation')
  @ApiCreatedResponse({
    description: 'Invite to workspace successfully!',
  })
  @HttpCode(HttpStatus.OK)
  async confirm(
    @Body() confirmSharingWorkspaceData: ConfirmWorkspaceSharingInvitationDto,
  ) {
    try {
      await this.sharingWorkspaceService.confirmInvitation(
        confirmSharingWorkspaceData,
      );
      return handleDataResponse('Invitation accepted successfully', 'OK');
    } catch (error) {
      throw error;
    }
  }

  @Patch('decline-invitation/:inviteId')
  @ApiCreatedResponse({
    description: 'Invite to workspace successfully!',
  })
  @HttpCode(HttpStatus.OK)
  async decline(@Param('inviteId') inviteId: string) {
    await this.sharingWorkspaceService.declineInvitation(inviteId);
    return handleDataResponse('Invitation declined successfully', 'OK');
  }
}
