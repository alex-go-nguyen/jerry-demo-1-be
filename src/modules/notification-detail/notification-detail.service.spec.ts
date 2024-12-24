import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';

import { NotificationDetailService } from './notification-detail.service';
import { NotificationDetail } from './entities/notification-detail.entity';

describe('NotificationDetailService', () => {
  let service: NotificationDetailService;

  const mockNotificationDetailRepository = {
    save: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationDetailService,
        {
          provide: getRepositoryToken(NotificationDetail),
          useValue: mockNotificationDetailRepository,
        },
      ],
    }).compile();

    service = module.get<NotificationDetailService>(NotificationDetailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createNotificationDetail', () => {
    it('should create a notification detail', async () => {
      const createData = {
        accountInvitationId: '123',
        workspaceInvitationId: '456',
        activityLogId: '789',
      };

      mockNotificationDetailRepository.create.mockReturnValue({
        accountSharingInvitation: { id: '123' },
        workspaceSharingInvitation: { id: '456' },
        memberActivityLog: { id: '789' },
      });

      const saveSpy = jest
        .spyOn(mockNotificationDetailRepository, 'save')
        .mockResolvedValue({
          accountSharingInvitation: { id: '123' },
          workspaceSharingInvitation: { id: '456' },
          memberActivityLog: { id: '789' },
        });

      const result = await service.createNotificationDetail(createData);

      expect(result).toEqual({
        accountSharingInvitation: { id: '123' },
        workspaceSharingInvitation: { id: '456' },
        memberActivityLog: { id: '789' },
      });

      expect(saveSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          accountSharingInvitation: { id: '123' },
          workspaceSharingInvitation: { id: '456' },
          memberActivityLog: { id: '789' },
        }),
      );
    });

    it('should create a notification detail with only some of the fields', async () => {
      const createData = {
        accountInvitationId: '123',
      };

      mockNotificationDetailRepository.create.mockReturnValue({
        accountSharingInvitation: { id: '123' },
        workspaceSharingInvitation: null,
        memberActivityLog: null,
      });

      const saveSpy = jest
        .spyOn(mockNotificationDetailRepository, 'save')
        .mockResolvedValue({
          accountSharingInvitation: { id: '123' },
          workspaceSharingInvitation: null,
          memberActivityLog: null,
        });

      const result = await service.createNotificationDetail(createData);

      expect(result).toEqual({
        accountSharingInvitation: { id: '123' },
        workspaceSharingInvitation: null,
        memberActivityLog: null,
      });

      expect(saveSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          accountSharingInvitation: { id: '123' },
          workspaceSharingInvitation: null,
          memberActivityLog: null,
        }),
      );
    });
  });
});
