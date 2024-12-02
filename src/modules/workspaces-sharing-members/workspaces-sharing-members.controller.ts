import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';

import { handleDataResponse } from '@/utils';
import { CheckPolicies } from '@/decorators';
import { PoliciesWorkspaceGuard } from '@/guards';
import { Role, RoleAccess } from '@/common/enums';
import { AuthGuard } from '@/modules/auth/auth.guard';
import { Roles } from '@/modules/auth/roles.decorator';
import { RolesGuard } from '@/modules/auth/roles.guard';
import { Workspace } from '@/modules/workspace/entities/workspace.entity';

import { UpdateWorkspaceSharingMemberDto } from './dtos';
import { WorkspacesSharingMembersService } from './workspaces-sharing-members.service';

@ApiTags('WorkspaceSharingMember')
@Controller('workspaces-members')
export class WorkspacesSharingMembersController {
  constructor(
    private readonly workspacesSharingMembersService: WorkspacesSharingMembersService,
  ) {}

  @Patch(':workspaceId')
  @Roles(Role.User)
  @UseGuards(AuthGuard, RolesGuard, PoliciesWorkspaceGuard)
  @CheckPolicies((ability) => ability.can(RoleAccess.MANAGE, Workspace))
  @HttpCode(HttpStatus.OK)
  @ApiCreatedResponse({
    description: 'Update workspace sharing member successfully!',
  })
  async updateRoleAccess(
    @Body() accountSharingMemberData: UpdateWorkspaceSharingMemberDto,
  ) {
    await this.workspacesSharingMembersService.updateRoleAccess(
      accountSharingMemberData,
    );
    return handleDataResponse(
      'Update workspace sharing member successfully!',
      'OK',
    );
  }
}
