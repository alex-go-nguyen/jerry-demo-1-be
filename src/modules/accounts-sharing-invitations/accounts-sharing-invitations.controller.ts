import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';

import { PoliciesGuard } from '@/guards';
import { CheckPolicies } from '@/decorators';
import { handleDataResponse } from '@/utils';
import { Role, RoleAccess } from '@/common/enums';
import { AuthGuard } from '@/modules/auth/auth.guard';
import { Roles } from '@/modules/auth/roles.decorator';
import { RolesGuard } from '@/modules/auth/roles.guard';
import { Account } from '@/modules/account/entities/account.entity';

import {
  ConfirmSharingAccounntDto,
  CreateAccountsSharingInvitationsDto,
} from './dtos';
import { AccountsSharingInvitationsService } from './accounts-sharing-invitations.service';

@ApiTags('SharingAccountInvitation')
@Controller('accounts-sharing')
export class AccountsSharingInvitationsController {
  constructor(
    private readonly accountsSharingInvitationsService: AccountsSharingInvitationsService,
  ) {}

  @Post('create/:accountId')
  @Roles(Role.User)
  @UseGuards(AuthGuard, RolesGuard, PoliciesGuard)
  @CheckPolicies((ability) => ability.can(RoleAccess.Manage, Account))
  @ApiCreatedResponse({
    description: 'Invite to workspace successfully!',
  })
  async create(
    @Body() accountsSharingInvitationsData: CreateAccountsSharingInvitationsDto,
    @Req() request: Request,
  ) {
    try {
      const user = request['user'];
      await this.accountsSharingInvitationsService.create(
        user.id,
        accountsSharingInvitationsData,
      );
      return handleDataResponse('Invite members successfully', 'OK');
    } catch (error) {
      throw error;
    }
  }

  @Post('confirm-invitation')
  @ApiCreatedResponse({
    description: 'Invite to account successfully!',
  })
  @HttpCode(200)
  async confirm(@Body() confirmSharingAccounntData: ConfirmSharingAccounntDto) {
    try {
      await this.accountsSharingInvitationsService.confirmInvitation(
        confirmSharingAccounntData,
      );
      return handleDataResponse('Invitation accepted successfully', 'OK');
    } catch (error) {
      throw error;
    }
  }
}
