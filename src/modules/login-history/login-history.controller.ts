import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Ip,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { Fingerprint, IFingerprint } from 'nestjs-fingerprint';

import { ErrorCode, Role } from '@/common/enums';
import { CurrentUser } from '@/decorators';
import { handleDataResponse } from '@/utils';
import { AuthGuard } from '@/modules/auth/auth.guard';
import { Roles } from '@/modules/auth/roles.decorator';
import { RolesGuard } from '@/modules/auth/roles.guard';
import { User } from '@/modules/user/entities/user.entity';

import { CreateLoginHistoryDto } from './dtos';
import { LoginHistoryService } from './login-history.service';

@ApiTags('Login-History')
@Controller('login-history')
@UseGuards(AuthGuard, RolesGuard)
export class LoginHistoryController {
  constructor(private readonly loginHistoryService: LoginHistoryService) {}

  @Post('store')
  @Roles(Role.User)
  async create(
    @CurrentUser() user: User,
    @Req() request: Request,
    @Ip() ipAddress: string,
    @Fingerprint() fp: IFingerprint,
    @Body() createLoginHistoryData: CreateLoginHistoryDto,
  ) {
    try {
      if (!user) {
        throw new UnauthorizedException(ErrorCode.USER_NOT_FOUND);
      }
      const createLoginHistoryPayload = {
        ipAddress,
        deviceId: fp.id,
        userAgent: request.headers['user-agent'],
        ...createLoginHistoryData,
      };
      await this.loginHistoryService.create(user, createLoginHistoryPayload);
      return handleDataResponse('Save login history successfully', 'OK');
    } catch (error) {
      throw error;
    }
  }

  @Get('')
  @Roles(Role.User)
  @HttpCode(200)
  async getLoginHistory(@CurrentUser() user: User, @Query() query) {
    try {
      if (!user) {
        throw new UnauthorizedException(ErrorCode.USER_NOT_FOUND);
      }
      return this.loginHistoryService.findAll(user, query);
    } catch (error) {
      throw error;
    }
  }

  @Delete('bulk-soft-delete')
  @Roles(Role.User)
  @HttpCode(204)
  async bulkSoftDelete(
    @CurrentUser() user: User,
    @Body() loginHistoryIds: string[],
  ) {
    try {
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return this.loginHistoryService.bulkSoftDelete(user, loginHistoryIds);
    } catch (error) {
      throw error;
    }
  }
}
