import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { ActivityType, ErrorCode } from '@/common/enums';
import { User } from '@/modules/user/entities/user.entity';
import { NotificationDetailService } from '@/modules/notification-detail/notification-detail.service';

import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,

    private readonly notificationDetailService: NotificationDetailService,
  ) {}

  async createNotification(data: {
    receipient: string;
    sender: User;
    activityType: ActivityType;
    accountInvitationId?: string;
    workspaceInvitationId?: string;
    activityLogId?: string;
  }): Promise<Notification> {
    const notificationDetail =
      await this.notificationDetailService.createNotificationDetail({
        accountInvitationId: data?.accountInvitationId,
        workspaceInvitationId: data?.workspaceInvitationId,
        activityLogId: data.activityLogId,
      });

    const notification = this.notificationRepository.create({
      receipient: data.receipient,
      sender: data.sender,
      activityType: data.activityType,
      notificationDetail,
    });

    return await this.notificationRepository.save(notification);
  }

  async findAll(userEmail: string) {
    return this.notificationRepository.find({
      where: {
        receipient: userEmail,
      },
      relations: [
        'sender',
        'notificationDetail',
        'notificationDetail.accountSharingInvitation',
        'notificationDetail.accountSharingInvitation.account',
        'notificationDetail.workspaceSharingInvitation',
        'notificationDetail.workspaceSharingInvitation.workspace',
        'notificationDetail.memberActivityLog',
        'notificationDetail.memberActivityLog.account',
        'notificationDetail.memberActivityLog.workspace',
      ],
      withDeleted: true,
      select: {
        sender: { name: true, avatar: true },
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async setRead(user: User, notificaitonId: string) {
    const existedNofication = await this.notificationRepository.findOne({
      where: {
        id: notificaitonId,
        receipient: user.email,
      },
    });

    if (!existedNofication) {
      throw new Error(ErrorCode.NOTIFICATION_NOT_FOUND);
    }

    await this.notificationRepository.update(
      {
        id: notificaitonId,
      },
      {
        isRead: true,
      },
    );
  }
}
