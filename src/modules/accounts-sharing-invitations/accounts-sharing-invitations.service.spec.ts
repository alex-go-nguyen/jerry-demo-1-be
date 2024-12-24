import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from '@nestjs-modules/mailer';

import { User } from '@/modules/user/entities/user.entity';
import { Account } from '@/modules/account/entities/account.entity';
import { NotificationService } from '@/modules/notification/notification.service';
import { NotificationGateway } from '@/modules/notification/notification.gateway';
import { MemberActivityLogService } from '@/modules/member-activity-log/member-activity-log.service';
import { AccountsSharingMembersService } from '@/modules/accounts-sharing-members/accounts-sharing-members.service';

import { AccountsSharingInvitationsService } from './accounts-sharing-invitations.service';
import { AccountsSharingInvitations } from './entities/accounts-sharing-invitations.entity';
import {
  ActivityType,
  EntityType,
  ErrorCode,
  RoleAccess,
  StatusInvitation,
} from '@/common/enums';

describe('AccountsSharingInvitationsService', () => {
  let service: AccountsSharingInvitationsService;
  let accountsSharingInvitationsRepository: Repository<AccountsSharingInvitations>;
  let mailerService: MailerService;

  const mockAccountsSharingInvitationsRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockAccountRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockNotificationService = {
    createNotification: jest.fn(),
  };

  const mockNotificationGateway = {
    sendNotification: jest.fn(),
  };

  const mockMailerService = {
    sendMail: jest.fn(),
  };

  const mockMemberActivityLogService = {
    create: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockAccountsSharingMembersService = {
    create: jest.fn(),
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsSharingInvitationsService,
        {
          provide: getRepositoryToken(AccountsSharingInvitations),
          useValue: mockAccountsSharingInvitationsRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Account),
          useValue: mockAccountRepository,
        },
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
        {
          provide: NotificationGateway,
          useValue: mockNotificationGateway,
        },
        {
          provide: MemberActivityLogService,
          useValue: mockMemberActivityLogService,
        },
        {
          provide: AccountsSharingMembersService,
          useValue: mockAccountsSharingMembersService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: MailerService,
          useValue: mockMailerService,
        },
      ],
    }).compile();

    service = module.get<AccountsSharingInvitationsService>(
      AccountsSharingInvitationsService,
    );
    accountsSharingInvitationsRepository = module.get(
      getRepositoryToken(AccountsSharingInvitations),
    );
    mailerService = module.get(MailerService);
  });

  describe('create', () => {
    it('should throw ACCOUNT_NOT_FOUND if account does not exist', async () => {
      await expect(
        service.create({} as User, {
          accountId: '123',
          ownerId: 'owner_id',
          sharingMembers: [],
        }),
      ).rejects.toThrow(ErrorCode.ACCOUNT_NOT_FOUND);
    });

    it('should throw NO_SHARING_MEMBERS_PROVIDED if no members are passed', async () => {
      mockAccountRepository.findOne.mockResolvedValue({
        id: '123',
        members: [],
      } as Account);

      await expect(
        service.create({} as User, {
          accountId: '123',
          ownerId: 'owner_id',
          sharingMembers: [],
        }),
      ).rejects.toThrow(ErrorCode.NO_SHARING_MEMBERS_PROVIDED);
    });

    it('should save new invitations and send emails', async () => {
      const mockAccount = {
        id: '123',
        members: [],
        username: 'Test Account',
        owner: { id: '1', email: 'owner@example.com' },
      } as Account;

      const mockUser = {
        id: '2',
        name: 'Test User',
      } as User;

      const mockInvitations = [
        { email: 'test1@example.com', roleAccess: RoleAccess.READ },
      ];
      const mockNotification = { id: 'notification_id' };
      mockNotificationService.createNotification.mockResolvedValue(
        mockNotification,
      );

      const mockActivityLog = { id: 'activity_log_id' };
      mockMemberActivityLogService.create.mockResolvedValue(mockActivityLog);

      mockAccountRepository.findOne.mockResolvedValue(mockAccount);
      mockAccountsSharingInvitationsRepository.create.mockImplementation(
        (data) => data,
      );
      mockAccountsSharingInvitationsRepository.save.mockResolvedValue(
        mockInvitations,
      );
      mockMailerService.sendMail.mockResolvedValueOnce(null);

      await service.create(mockUser, {
        accountId: '123',
        ownerId: mockUser.id,
        sharingMembers: mockInvitations,
      });

      expect(mockMemberActivityLogService.create).toHaveBeenCalledWith({
        accountId: '123',
        entityType: EntityType.ACCOUNT,
        action: RoleAccess.MANAGE,
      });

      expect(mockNotificationService.createNotification).toHaveBeenCalledWith({
        receipient: 'owner@example.com',
        sender: mockUser,
        activityType: ActivityType.MEMBER_SHARE_AN_ACCOUNT,
        activityLogId: mockActivityLog.id,
      });

      expect(mockNotificationGateway.sendNotification).toHaveBeenCalledTimes(2);

      expect(accountsSharingInvitationsRepository.create).toHaveBeenCalled();

      expect(accountsSharingInvitationsRepository.save).toHaveBeenCalledWith(
        expect.any(Array),
      );

      expect(mailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'test1@example.com' }),
      );
    });
  });

  describe('confirmInvitation', () => {
    it('should throw INVITATION_NOT_FOUND if no invitation exists', async () => {
      mockAccountsSharingInvitationsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.confirmInvitation({ inviteId: '123' }),
      ).rejects.toThrow(ErrorCode.INVITATION_NOT_FOUND);
    });

    it('should mark invitation as accepted and add member', async () => {
      const mockInvitation = {
        id: '123',
        email: 'test@example.com',
        account: { id: 'account123' } as Account,
        status: StatusInvitation.PENDING,
      } as AccountsSharingInvitations;

      const mockUser = { email: 'test@example.com' } as User;

      mockAccountsSharingInvitationsRepository.findOne.mockResolvedValue(
        mockInvitation,
      );
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockAccountsSharingInvitationsRepository.save.mockResolvedValue(null);
      mockAccountsSharingMembersService.create.mockResolvedValue(null);

      await service.confirmInvitation({ inviteId: '123' });

      expect(
        mockAccountsSharingInvitationsRepository.save,
      ).toHaveBeenCalledWith(
        expect.objectContaining({ status: StatusInvitation.ACCEPTED }),
      );
      expect(mockAccountsSharingMembersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ member: mockUser }),
      );
    });
  });

  describe('declineInvitation', () => {
    it('should throw INVITATION_NOT_FOUND if invitation does not exist', async () => {
      mockAccountsSharingInvitationsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.declineInvitation('invalid-invite-id'),
      ).rejects.toThrow(ErrorCode.INVITATION_NOT_FOUND);
    });

    it('should throw INVALID_LINK_CONFIRM_INVITATION if invitation status is not PENDING', async () => {
      const mockInvitation = {
        id: '123',
        status: StatusInvitation.ACCEPTED,
      } as AccountsSharingInvitations;
      mockAccountsSharingInvitationsRepository.findOne.mockResolvedValue(
        mockInvitation,
      );

      await expect(service.declineInvitation('123')).rejects.toThrow(
        ErrorCode.INVALID_LINK_CONFIRM_INVITATION,
      );
    });

    it('should throw USER_NOT_FOUND if user does not exist', async () => {
      const mockInvitation = {
        id: '123',
        email: 'test@example.com',
        status: StatusInvitation.PENDING,
      } as AccountsSharingInvitations;
      mockAccountsSharingInvitationsRepository.findOne.mockResolvedValue(
        mockInvitation,
      );

      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.declineInvitation('123')).rejects.toThrow(
        ErrorCode.USER_NOT_FOUND,
      );
    });

    it('should decline invitation and save the status', async () => {
      const mockInvitation = {
        id: '123',
        email: 'test@example.com',
        status: StatusInvitation.PENDING,
      } as AccountsSharingInvitations;
      mockAccountsSharingInvitationsRepository.findOne.mockResolvedValue(
        mockInvitation,
      );

      const mockUser = { email: 'test@example.com' } as User;
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      mockAccountsSharingInvitationsRepository.save.mockResolvedValue(
        mockInvitation,
      );

      await service.declineInvitation('123');

      expect(
        mockAccountsSharingInvitationsRepository.save,
      ).toHaveBeenCalledWith(
        expect.objectContaining({ status: StatusInvitation.DECLINE }),
      );
    });
  });
});
