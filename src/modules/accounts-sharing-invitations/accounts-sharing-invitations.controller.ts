import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';

import { PoliciesGuard } from '@/guards';
import { handleDataResponse } from '@/utils';
import { Role, RoleAccess } from '@/common/enums';
import { AuthGuard } from '@/modules/auth/auth.guard';
import { Roles } from '@/modules/auth/roles.decorator';
import { RolesGuard } from '@/modules/auth/roles.guard';
import { CheckPolicies, CurrentUser } from '@/decorators';
import { User } from '@/modules/user/entities/user.entity';
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

  @Post('create')
  @Roles(Role.User)
  @UseGuards(AuthGuard, RolesGuard, PoliciesGuard)
  @CheckPolicies((ability) => ability.can(RoleAccess.MANAGE, Account))
  @ApiCreatedResponse({
    description: 'Invite to account successfully!',
  })
  async create(
    @Body() accountsSharingInvitationsData: CreateAccountsSharingInvitationsDto,
    @CurrentUser() user: User,
  ) {
    try {
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
  @HttpCode(HttpStatus.OK)
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
