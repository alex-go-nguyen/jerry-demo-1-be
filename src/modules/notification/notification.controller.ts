import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';

import { CurrentUser } from '@/decorators';
import { AuthGuard } from '@/modules/auth/auth.guard';
import { RolesGuard } from '@/modules/auth/roles.guard';
import { User } from '@/modules/user/entities/user.entity';

import { NotificationService } from './notification.service';

@ApiTags('Notification')
@Controller('notifications')
@UseGuards(AuthGuard, RolesGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('')
  async findAll(@CurrentUser() user: User) {
    return this.notificationService.findAll(user.email);
  }

  @Patch(':notificationId')
  async setRead(
    @Param('notificationId') notificationId: string,
    @CurrentUser() user: User,
  ) {
    return this.notificationService.setRead(user, notificationId);
  }
}
