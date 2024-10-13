import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';

import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';

import { Role } from '@/common/enums';

import { AuthGuard } from '@/modules/auth/auth.guard';
import { RolesGuard } from '@/modules/auth/roles.guard';
import { Roles } from '@/modules/auth/roles.decorator';

import { SharingWorkspaceService } from './sharing-workspace.service';
import { CreateSharingWorkspaceDto } from './dto/create-sharing-workspace.dto';

@ApiTags('SharingWorkspace')
@Controller('sharing-workspace')
export class SharingWorkspaceController {
  constructor(
    private readonly sharingWorkspaceService: SharingWorkspaceService,
  ) {}

  @Post('create')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.User)
  @ApiCreatedResponse({
    description: 'Invite to workspace successfully!',
  })
  async create(
    @Body() createSharingWorkspaceDto: CreateSharingWorkspaceDto,
    @Req() request: Request,
  ) {
    try {
      const user = request['user'];
      return await this.sharingWorkspaceService.create(
        user.id,
        createSharingWorkspaceDto,
      );
    } catch (error) {
      throw error;
    }
  }

  @Post('confirm-invitation')
  @ApiCreatedResponse({
    description: 'Invite to workspace successfully!',
  })
  async confirm(@Body('inviteId') inviteId: string) {
    try {
      return await this.sharingWorkspaceService.confirmInvitation(inviteId);
    } catch (error) {
      throw error;
    }
  }
}
