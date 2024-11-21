import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBadRequestResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/decorators';
import { ErrorCode, Role } from '@/common/enums';
import { AuthGuard } from '@/modules/auth/auth.guard';
import { Roles } from '@/modules/auth/roles.decorator';
import { RolesGuard } from '@/modules/auth/roles.guard';

import { UsersService } from './user.service';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dtos/update-user.dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(AuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('')
  @Roles(Role.Admin)
  async getUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    try {
      const currentPage = Math.max(Number(page), 1);
      const pageSize = Math.max(Number(limit), 1);

      const dataUsers = await this.usersService.getUsers(currentPage, pageSize);
      return dataUsers;
    } catch (error) {
      throw error;
    }
  }

  @Patch('update-profile')
  @Roles(Role.Admin, Role.User)
  async updateProfile(@Body() profileData: UpdateUserDto) {
    try {
      return await this.usersService.updateProfile(profileData);
    } catch (error) {
      if (error.message === ErrorCode.USER_NOT_FOUND) {
        throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
      } else if (error.message === ErrorCode.MISSING_INPUT) {
        throw new BadRequestException(ErrorCode.MISSING_INPUT);
      } else {
        throw error;
      }
    }
  }

  @Delete('deactivate/:userId')
  @Roles(Role.Admin)
  async deactivateUser(@Param('userId') userId: string) {
    try {
      return await this.usersService.deactivateUser(userId);
    } catch (error) {
      if (error.message === ErrorCode.USER_NOT_FOUND) {
        throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
      } else if (error.message === ErrorCode.MISSING_INPUT) {
        throw new BadRequestException(ErrorCode.MISSING_INPUT);
      } else {
        throw error;
      }
    }
  }

  @Patch('active/:userId')
  @Roles(Role.Admin)
  @ApiBadRequestResponse({ description: 'Missing input!' })
  @ApiOkResponse({ description: 'Restore workspace ok' })
  async restoreWorkspace(@Param('userId') userId: string) {
    try {
      return await this.usersService.activeUser(userId);
    } catch (error) {
      throw error;
    }
  }

  @Get('/currentUser')
  @Roles(Role.Admin, Role.User)
  async me(@CurrentUser() user: User) {
    return this.usersService.findById(user.id);
  }

  @Patch('skip-twofa')
  @Roles(Role.Admin, Role.User)
  async skipTwoFa(@CurrentUser() user: User) {
    try {
      if (!user) {
        throw new UnauthorizedException(ErrorCode.USER_NOT_FOUND);
      }
      return this.usersService.skipTwoFa(user.id);
    } catch (error) {
      throw error;
    }
  }
}
