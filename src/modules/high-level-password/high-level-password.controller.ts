import { ApiTags } from '@nestjs/swagger';
import { Controller, Post, Body, Patch, UseGuards } from '@nestjs/common';

import { CurrentUser } from '@/decorators';
import { handleDataResponse } from '@/utils';
import { AuthGuard } from '@/modules/auth/auth.guard';
import { RolesGuard } from '@/modules/auth/roles.guard';
import { User } from '@/modules/user/entities/user.entity';

import { HighLevelPasswordService } from './high-level-password.service';
import { CreateHighLevelPasswordDto } from './dtos/create-high-level-password.dto';

@ApiTags('High-Level-Password')
@Controller('high-level-passwords')
@UseGuards(AuthGuard, RolesGuard)
export class HighLevelPasswordController {
  constructor(
    private readonly highLevelPasswordService: HighLevelPasswordService,
  ) {}

  @Post()
  async create(
    @CurrentUser() user: User,
    @Body() createHighLevelPasswordData: CreateHighLevelPasswordDto,
  ) {
    return this.highLevelPasswordService.create(
      user.id,
      createHighLevelPasswordData,
    );
  }

  @Post('verify')
  async verifyHighLevelPassword(
    @CurrentUser() user: User,
    @Body() createHighLevelPasswordData: CreateHighLevelPasswordDto,
  ) {
    await this.highLevelPasswordService.verifyHighLevelPassword(
      user.id,
      createHighLevelPasswordData.password,
    );
    return handleDataResponse('OK', 'Verify high level password successfully');
  }

  @Patch('')
  async turnOff(@CurrentUser() user: User) {
    return this.highLevelPasswordService.toggleHighPassword(user.id);
  }
}
