import { ApiTags } from '@nestjs/swagger';

import { PoliciesGuard } from '@/guards';
import { Role, RoleAccess } from '@/common/enums';
import { AuthGuard } from '@/modules/auth/auth.guard';
import { Roles } from '@/modules/auth/roles.decorator';
import { RolesGuard } from '@/modules/auth/roles.guard';
import { CheckPolicies, CurrentUser } from '@/decorators';
import { User } from '@/modules/user/entities/user.entity';
import { Account } from '@/modules/account/entities/account.entity';
import { Controller, Get, Param, Delete, UseGuards } from '@nestjs/common';

import { AccountVersionService } from './account-version.service';

@ApiTags('account-version')
@Controller('account-version')
@UseGuards(AuthGuard, RolesGuard)
export class AccountVersionController {
  constructor(private readonly accountVersionService: AccountVersionService) {}

  @Get(':accountId')
  @Roles(Role.User)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(RoleAccess.MANAGE, Account))
  async getAccountVersions(@Param('accountId') accountId: string) {
    return this.accountVersionService.getAccountVersions(accountId);
  }

  @Delete(':versionId')
  remove(@Param('versionId') versionId: string, @CurrentUser() user: User) {
    return this.accountVersionService.remove(versionId, user.id);
  }
}
