import {
  Controller,
  Post,
  Body,
  Req,
  BadRequestException,
  UseGuards,
  Get,
  HttpCode,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiBadRequestResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { Role } from '@/common/enums';
import { PoliciesGuard } from '@/guards';
import { handleDataResponse } from '@/utils';
import { CheckPolicies } from '@/decorators';
import { AuthGuard } from '@/modules/auth/auth.guard';
import { ErrorCode, RoleAccess } from '@/common/enums';
import { Roles } from '@/modules/auth/roles.decorator';
import { RolesGuard } from '@/modules/auth/roles.guard';

import { UpdateAccountDto } from './dto';
import { AccountService } from './account.service';
import { Account } from './entities/account.entity';
import { CreateAccountDto } from './dto/create-account.dto';

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
    @Req() request: Request,
  ) {
    try {
      const user = request['user'];

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
  @HttpCode(200)
  @ApiOkResponse({
    description: 'Get accounts successfully!',
  })
  async getAccountsByUserId(@Req() request: Request) {
    try {
      const user = request['user'];
      return this.accountService.getAccountsByUserId(user.id);
    } catch (error) {
      throw error;
    }
  }

  @Get(':accountId')
  @Roles(Role.User)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(RoleAccess.Read, Account))
  @HttpCode(200)
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
  @CheckPolicies((ability) => ability.can(RoleAccess.Update, Account))
  @HttpCode(200)
  @ApiOkResponse({
    description: 'Update account successfully!',
  })
  async updateAccount(
    @Param('accountId') accountId: string,
    @Req() request: Request,
    @Body() updateAccountData: UpdateAccountDto,
  ) {
    try {
      const user = request['user'];
      await this.accountService.updateAccount(
        user.id,
        accountId,
        updateAccountData,
      );
      return handleDataResponse('Update account successfully', 'OK');
    } catch (error) {
      throw error;
    }
  }

  @Delete('delete/:accountId')
  @Roles(Role.User)
  @HttpCode(204)
  @ApiOkResponse({
    description: 'Delete account successfully!',
  })
  async softRemove(
    @Param('accountId') accountId: string,
    @Req() request: Request,
  ) {
    try {
      const user = request['user'];
      await this.accountService.softRemove(user.id, accountId);
      return handleDataResponse('Delete account successfully', 'OK');
    } catch (error) {
      throw error;
    }
  }
}
