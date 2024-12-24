import {
  Controller,
  Post,
  Body,
  BadRequestException,
  UseGuards,
  Get,
  HttpCode,
  Param,
  Put,
  Delete,
  HttpStatus,
  Query,
  Patch,
} from '@nestjs/common';
import { ApiBadRequestResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { Role } from '@/common/enums';
import { PoliciesGuard } from '@/guards';
import { CurrentUser } from '@/decorators';
import { handleDataResponse } from '@/utils';
import { CheckPolicies } from '@/decorators';
import { AuthGuard } from '@/modules/auth/auth.guard';
import { ErrorCode, RoleAccess } from '@/common/enums';
import { Roles } from '@/modules/auth/roles.decorator';
import { RolesGuard } from '@/modules/auth/roles.guard';
import { User } from '@/modules/user/entities/user.entity';

import { UpdateAccountDto } from './dto';
import { AccountService } from './account.service';
import { Account } from './entities/account.entity';
import { CreateAccountDto } from './dto/create-account.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';

@ApiTags('Account')
@Controller('accounts')
@UseGuards(AuthGuard, RolesGuard)
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post('store')
  @Roles(Role.User)
  @ApiBadRequestResponse({ description: 'Missing input!' })
  @ApiOkResponse({
    description: 'Store account successfully!',
  })
  async storeAccount(
    @Body() createAccountDto: CreateAccountDto,
    @CurrentUser() user: User,
  ) {
    try {
      await this.accountService.createAccountService(user, createAccountDto);
      return handleDataResponse('Store account successfully!', 'OK');
    } catch (error) {
      if (error.message === ErrorCode.MISSING_INPUT) {
        throw new BadRequestException(ErrorCode.MISSING_INPUT);
      } else {
        throw error;
      }
    }
  }

  @Get('')
  @Roles(Role.User)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Get accounts successfully!',
  })
  async getAccountsByUserId(
    @CurrentUser() user: User,
    @Query() query: PaginationQueryDto,
  ) {
    return this.accountService.getAccountsByUserId(user.id, query);
  }

  @Get(':accountId')
  @Roles(Role.User)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(RoleAccess.READ, Account))
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Get account by id successfully!',
  })
  async getAccountById(@Param('accountId') accountId: string) {
    try {
      return this.accountService.getAccountById(accountId);
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  @Put('update/:accountId')
  @Roles(Role.User)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(RoleAccess.UPDATE, Account))
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Update account successfully!',
  })
  async updateAccount(
    @Param('accountId') accountId: string,
    @CurrentUser() user: User,
    @Body() updateAccountData: UpdateAccountDto,
  ) {
    try {
      await this.accountService.updateAccount(
        user,
        accountId,
        updateAccountData,
      );
      return handleDataResponse('Update account successfully', 'OK');
    } catch (error) {
      throw error;
    }
  }

  @Patch('rollback/:versionId')
  @Roles(Role.User)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Update account successfully!',
  })
  async rollback(
    @Param('versionId') versionId: string,
    @CurrentUser() user: User,
  ) {
    try {
      await this.accountService.rollbackToVersion(user.id, versionId);
      return handleDataResponse('Rollback account successfully', 'OK');
    } catch (error) {
      throw error;
    }
  }

  @Delete('delete/:accountId')
  @Roles(Role.User)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOkResponse({
    description: 'Delete account successfully!',
  })
  async softRemove(
    @Param('accountId') accountId: string,
    @CurrentUser() user: User,
  ) {
    try {
      await this.accountService.softRemove(user.id, accountId);
      return handleDataResponse('Delete account successfully', 'OK');
    } catch (error) {
      throw error;
    }
  }
}
