import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';

import {
  Controller,
  Post,
  Body,
  UseGuards,
  NotFoundException,
  HttpCode,
} from '@nestjs/common';

import { CurrentUser } from '@/decorators';
import { handleDataResponse } from '@/utils';
import { ErrorCode, Role } from '@/common/enums';
import { AuthGuard } from '@/modules/auth/auth.guard';
import { Roles } from '@/modules/auth/roles.decorator';
import { RolesGuard } from '@/modules/auth/roles.guard';
import { User } from '@/modules/user/entities/user.entity';

import { SharingWorkspaceService } from './sharing-workspace.service';
import { CreateSharingWorkspaceDto, ConfirmSharingWorkspaceDto } from './dtos';

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
  @HttpCode(200)
  async create(
    @Body() createSharingWorkspaceDto: CreateSharingWorkspaceDto,
    @CurrentUser() user: User,
  ) {
    try {
      await this.sharingWorkspaceService.create(
        user.id,
        createSharingWorkspaceDto,
      );
      return handleDataResponse('Invite members successfully', 'OK');
    } catch (error) {
      if (error.message === ErrorCode.WORKSPACE_NOT_FOUND) {
        throw new NotFoundException(ErrorCode.WORKSPACE_NOT_FOUND);
      }
      throw error;
    }
  }

  @Post('confirm-invitation')
  @ApiCreatedResponse({
    description: 'Invite to workspace successfully!',
  })
  @HttpCode(200)
  async confirm(
    @Body() confirmSharingWorkspaceData: ConfirmSharingWorkspaceDto,
  ) {
    try {
      await this.sharingWorkspaceService.confirmInvitation(
        confirmSharingWorkspaceData,
      );
      return handleDataResponse('Invitation accepted successfully', 'OK');
    } catch (error) {
      if (
        error.message === ErrorCode.INVITATION_NOT_FOUND ||
        error.message === ErrorCode.USER_NOT_FOUND
      ) {
        throw new NotFoundException(ErrorCode.INVITATION_NOT_FOUND);
      } else {
        throw error;
      }
    }
  }
}
