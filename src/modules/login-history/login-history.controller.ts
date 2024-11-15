import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Ip,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Fingerprint, IFingerprint } from 'nestjs-fingerprint';

import { Role } from '@/common/enums';
import { handleDataResponse } from '@/utils';
import { AuthGuard } from '@/modules/auth/auth.guard';
import { Roles } from '@/modules/auth/roles.decorator';
import { RolesGuard } from '@/modules/auth/roles.guard';

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
    @Req() request: Request,
    @Ip() ipAddress: string,
    @Fingerprint() fp: IFingerprint,
    @Body() createLoginHistoryData: CreateLoginHistoryDto,
  ) {
    try {
      const user = request['user'];
      if (!user) {
        throw new UnauthorizedException('User not found');
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
  async getLoginHistory(@Req() request: Request) {
    try {
      const user = request['user'];
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return this.loginHistoryService.findAll(user);
    } catch (error) {
      throw error;
    }
  }

  @Delete('bulk-soft-delete')
  @Roles(Role.User)
  @HttpCode(204)
  async bulkSoftDelete(
    @Req() request: Request,
    @Body() loginHistoryIds: string[],
  ) {
    try {
      const user = request['user'];
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return this.loginHistoryService.bulkSoftDelete(user, loginHistoryIds);
    } catch (error) {
      throw error;
    }
  }
}
