import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { NotificationDetail } from './entities/notification-detail.entity';

@Injectable()
export class NotificationDetailService {
  constructor(
    @InjectRepository(NotificationDetail)
    private readonly notificationDetailRepository: Repository<NotificationDetail>,
  ) {}

  async createNotificationDetail(data: {
    accountInvitationId?: string;
    workspaceInvitationId?: string;
    activityLogId?: string;
  }): Promise<NotificationDetail> {
    const detail = this.notificationDetailRepository.create({
      accountSharingInvitation: data.accountInvitationId
        ? { id: data.accountInvitationId }
        : null,
      workspaceSharingInvitation: data.workspaceInvitationId
        ? { id: data.workspaceInvitationId }
        : null,
      memberActivityLog: data.activityLogId ? { id: data.activityLogId } : null,
    });
    return this.notificationDetailRepository.save(detail);
  }
}
