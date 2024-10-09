import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  HttpStatus,
  BadRequestException,
  UseGuards,
  Get,
  HttpCode,
  Param,
  Put,
  Delete,
} from '@nestjs/common';

import { ApiBadRequestResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { Response, Request } from 'express';

import { ErrorCode } from '@/common/enums';

import { handleDataResponse } from '@/utils';

import { Role } from '@/common/enums';
import { Roles } from '@/modules/auth/roles.decorator';

import { RolesGuard } from '@/modules/auth/roles.guard';
import { AuthGuard } from '@/modules/auth/auth.guard';

import { AccountService } from './account.service';

import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto';

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
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      const user = request['user'];
      //  eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { createdAt, updatedAt, ...account } =
        await this.accountService.createAccountService(user, createAccountDto);
      response.status(HttpStatus.OK).json({
        ...handleDataResponse('Store account successfully!'),
        account,
      });
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
      const listAccounts = await this.accountService.getAccountsByUserId(
        user.id,
      );
      return listAccounts;
    } catch (error) {
      throw error;
    }
  }

  @Get(':accountId')
  @Roles(Role.User)
  @HttpCode(200)
  @ApiOkResponse({
    description: 'Get account by id successfully!',
  })
  async getAccountById(
    @Param('accountId') accountId: string,
    @Req() request: Request,
  ) {
    try {
      const user = request['user'];
      return await this.accountService.getAccountByUserIdAndAccountId(
        user.id,
        accountId,
      );
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
  @Put('update/:accountId')
  @Roles(Role.User)
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
      return await this.accountService.updateAccount(
        user.id,
        accountId,
        updateAccountData,
      );
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
      return await this.accountService.softRemove(user.id, accountId);
    } catch (error) {
      throw error;
    }
  }
}
