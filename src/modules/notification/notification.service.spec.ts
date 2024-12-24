import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { ActivityType, ErrorCode } from '@/common/enums';
import { User } from '@/modules/user/entities/user.entity';
import { NotificationDetailService } from '@/modules/notification-detail/notification-detail.service';

import { NotificationService } from './notification.service';
import { Notification } from './entities/notification.entity';

describe('NotificationService', () => {
  let service: NotificationService;

  const mockNotificationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockNotificationDetailService = {
    createNotificationDetail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: getRepositoryToken(Notification),
          useValue: mockNotificationRepository,
        },
        {
          provide: NotificationDetailService,
          useValue: mockNotificationDetailService,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createNotification', () => {
    it('should create and save a notification', async () => {
      const mockDetail = { id: 'detail-1' };
      const mockNotification = { id: 'notification-1' } as Notification;
      const mockSender = { id: 'user-1', name: 'Sender User' } as User;

      mockNotificationDetailService.createNotificationDetail.mockResolvedValue(
        mockDetail,
      );
      mockNotificationRepository.create.mockReturnValue(mockNotification);
      mockNotificationRepository.save.mockResolvedValue(mockNotification);

      const data = {
        receipient: 'receiver@example.com',
        sender: mockSender,
        activityType: ActivityType.INVITATION_TO_WORKSPACE,
        accountInvitationId: 'invite-1',
      };

      const result = await service.createNotification(data);

      expect(
        mockNotificationDetailService.createNotificationDetail,
      ).toHaveBeenCalledWith({
        accountInvitationId: 'invite-1',
        workspaceInvitationId: undefined,
        activityLogId: undefined,
      });

      expect(mockNotificationRepository.create).toHaveBeenCalledWith({
        receipient: data.receipient,
        sender: data.sender,
        activityType: data.activityType,
        notificationDetail: mockDetail,
      });

      expect(mockNotificationRepository.save).toHaveBeenCalledWith(
        mockNotification,
      );
      expect(result).toEqual(mockNotification);
    });
  });

  describe('findAll', () => {
    it('should return all notifications for a user', async () => {
      const mockNotifications = [
        { id: 'notification-1', receipient: 'user@example.com' },
      ] as Notification[];

      mockNotificationRepository.find.mockResolvedValue(mockNotifications);

      const userEmail = 'user@example.com';
      const result = await service.findAll(userEmail);

      expect(mockNotificationRepository.find).toHaveBeenCalledWith({
        where: { receipient: userEmail },
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
        select: { sender: { name: true, avatar: true } },
        order: { createdAt: 'DESC' },
        withDeleted: true,
      });

      expect(result).toEqual(mockNotifications);
    });
  });

  describe('setRead', () => {
    it('should update notification as read', async () => {
      const mockUser = { email: 'user@example.com' } as User;
      const mockNotification = {
        id: 'notification-1',
        receipient: 'user@example.com',
      } as Notification;

      mockNotificationRepository.findOne.mockResolvedValue(mockNotification);
      mockNotificationRepository.update.mockResolvedValue({
        affected: 1,
      } as any);

      const notificationId = 'notification-1';

      await service.setRead(mockUser, notificationId);

      expect(mockNotificationRepository.findOne).toHaveBeenCalledWith({
        where: { id: notificationId, receipient: mockUser.email },
      });

      expect(mockNotificationRepository.update).toHaveBeenCalledWith(
        { id: notificationId },
        { isRead: true },
      );
    });

    it('should throw an error if notification is not found', async () => {
      mockNotificationRepository.findOne.mockResolvedValue(null);

      const mockUser = { email: 'user@example.com' } as User;
      const notificationId = 'invalid-notification';

      await expect(service.setRead(mockUser, notificationId)).rejects.toThrow(
        ErrorCode.NOTIFICATION_NOT_FOUND,
      );

      expect(mockNotificationRepository.findOne).toHaveBeenCalledWith({
        where: { id: notificationId, receipient: mockUser.email },
      });
    });
  });
});
