import { Controller, Get, UseGuards } from '@nestjs/common';

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

  @Get('/currentUser')
  @Roles(Role.Admin, Role.User)
  async me(@currentUser() user: User) {
    return user;
  }
}
