import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { ApiTags } from '@nestjs/swagger';

import { Role } from '@/common/enums';
import { Roles } from '@/modules/auth/roles.decorator';

import { RolesGuard } from '@/modules/auth/roles.guard';
import { AuthGuard } from '@/modules/auth/auth.guard';

import { currentUser } from './user.decorator';

import { UsersService } from './user.service';

import { User } from './entities/user.entity';

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

  @Get('/currentUser')
  @Roles(Role.Admin, Role.User)
  async me(@currentUser() user: User) {
    return user;
  }
}
