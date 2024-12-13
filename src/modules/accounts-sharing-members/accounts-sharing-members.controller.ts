import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';

import { PoliciesGuard } from '@/guards';
import { handleDataResponse } from '@/utils';
import { CheckPolicies } from '@/decorators';
import { Role, RoleAccess } from '@/common/enums';
import { AuthGuard } from '@/modules/auth/auth.guard';
import { Roles } from '@/modules/auth/roles.decorator';
import { RolesGuard } from '@/modules/auth/roles.guard';
import { Account } from '@/modules/account/entities/account.entity';

import { UpdateAccountSharingMemberDto } from './dtos';
import { AccountsSharingMembersService } from './accounts-sharing-members.service';

@ApiTags('SharingAccountMember')
@Controller('accounts-members')
export class AccountsSharingMembersController {
  constructor(
    private readonly accountsSharingMembersService: AccountsSharingMembersService,
  ) {}

  @Patch(':accountId')
  @Roles(Role.User)
  @UseGuards(AuthGuard, RolesGuard, PoliciesGuard)
  @CheckPolicies((ability) => ability.can(RoleAccess.MANAGE, Account))
  @HttpCode(HttpStatus.OK)
  @ApiCreatedResponse({
    description: 'Update acount sharing member successfully!',
  })
  async updateRoleAccess(
    @Body() accountSharingMemberData: UpdateAccountSharingMemberDto,
  ) {
    try {
      await this.accountsSharingMembersService.updateRoleAccess(
        accountSharingMemberData,
      );
      return handleDataResponse(
        'Update acount sharing member successfully!',
        'OK',
      );
    } catch (error) {
      throw error;
    }
  }
}
