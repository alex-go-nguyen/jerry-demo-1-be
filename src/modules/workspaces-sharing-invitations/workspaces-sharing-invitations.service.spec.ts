import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from '@nestjs-modules/mailer';

import { User } from '@/modules/user/entities/user.entity';
import { ErrorCode, RoleAccess, StatusInvitation } from '@/common/enums';
import { Workspace } from '@/modules/workspace/entities/workspace.entity';
import { NotificationService } from '@/modules/notification/notification.service';
import { NotificationGateway } from '@/modules/notification/notification.gateway';
import { MemberActivityLogService } from '@/modules/member-activity-log/member-activity-log.service';
import { WorkspacesSharingMembersService } from '@/modules/workspaces-sharing-members/workspaces-sharing-members.service';

import { SharingWorkspaceService } from './workspaces-sharing-invitations.service';
import { WorkspacesSharingInvitations } from './entities/workspaces-sharing-invitations.entity';

describe('WorkspacesSharingInvitationsService', () => {
  let service: SharingWorkspaceService;
  let workspacesSharingInvitationsRepository: Repository<WorkspacesSharingInvitations>;

  const mockWorkspacesSharingInvitationsRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockWorkspaceRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockWorkspacesSharingMembersService = {
    create: jest.fn(),
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SharingWorkspaceService,
        {
          provide: getRepositoryToken(WorkspacesSharingInvitations),
          useValue: mockWorkspacesSharingInvitationsRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Workspace),
          useValue: mockWorkspaceRepository,
        },
        {
          provide: WorkspacesSharingMembersService,
          useValue: mockWorkspacesSharingMembersService,
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
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: MailerService,
          useValue: mockMailerService,
        },
      ],
    }).compile();

    service = module.get<SharingWorkspaceService>(SharingWorkspaceService);
    workspacesSharingInvitationsRepository = module.get(
      getRepositoryToken(WorkspacesSharingInvitations),
    );
  });

  describe('create', () => {
    it('should throw WORKSPACE_NOT_FOUND if workspace does not exist', async () => {
      mockWorkspaceRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create({} as User, {
          workspaceId: 'none_id',
          sharingMembers: [],
          ownerId: 'owner_id',
        }),
      ).rejects.toThrow(ErrorCode.WORKSPACE_NOT_FOUND);
    });

    it('should throw NO_SHARING_MEMBERS_PROVIDED if no sharing members are provided', async () => {
      const mockWorkspace = { id: 'workspace1', members: [] };
      mockWorkspaceRepository.findOne.mockResolvedValue(mockWorkspace);

      await expect(
        service.create({} as User, {
          workspaceId: 'workspace1',
          sharingMembers: [],
          ownerId: 'owner_id',
        }),
      ).rejects.toThrow(ErrorCode.NO_SHARING_MEMBERS_PROVIDED);
    });

    it('should update role access for existing members if they are found', async () => {
      const mockWorkspace = {
        id: 'workspace1',
        owner: { id: 1, name: 'Jane Doe' },
        members: [
          {
            member: { email: 'existing@example.com' },
            roleAccess: RoleAccess.READ,
          },
        ],
      };

      const mockUser = { id: 'user1', name: 'Test User' } as User;
      const mockInvitation = {
        email: 'existing@example.com',
        roleAccess: RoleAccess.UPDATE,
      };

      mockWorkspaceRepository.findOne.mockResolvedValue(mockWorkspace);
      mockWorkspacesSharingInvitationsRepository.create.mockImplementation(
        (data) => data,
      );
      mockWorkspacesSharingInvitationsRepository.save.mockResolvedValue([
        mockInvitation,
      ]);
      mockMailerService.sendMail.mockResolvedValueOnce(null);

      await service.create(mockUser, {
        workspaceId: 'workspace1',
        sharingMembers: [mockInvitation],
        ownerId: '',
      });

      expect(mockWorkspaceRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          members: [
            {
              member: { email: 'existing@example.com' },
              roleAccess: RoleAccess.UPDATE,
            },
          ],
        }),
      );
    });

    it('should save new invitations and send email notifications', async () => {
      const mockWorkspace = {
        id: 'workspace1',
        owner: { id: 1, name: 'Jane Doe' },
        members: [],
      };
      const mockUser = { id: 'user1', name: 'Test User' } as User;
      const mockInvitation = {
        email: 'test@example.com',
        roleAccess: RoleAccess.READ,
      };

      mockWorkspaceRepository.findOne.mockResolvedValue(mockWorkspace);
      mockWorkspacesSharingInvitationsRepository.create.mockImplementation(
        (data) => data,
      );
      mockWorkspacesSharingInvitationsRepository.save.mockResolvedValue([
        mockInvitation,
      ]);
      mockMemberActivityLogService.create.mockResolvedValue({ id: 123 });
      mockMailerService.sendMail.mockResolvedValueOnce(null);

      await service.create(mockUser, {
        workspaceId: 'workspace1',
        sharingMembers: [mockInvitation],
        ownerId: '',
      });

      expect(
        mockWorkspacesSharingInvitationsRepository.save,
      ).toHaveBeenCalled();
      expect(mockMailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'test@example.com' }),
      );
    });

    it('should send a notification to the workspace owner if the user is not the owner', async () => {
      const mockWorkspace = {
        id: 'workspace1',
        owner: { id: 1, email: 'owner@example.com' },
        members: [],
      };
      const mockUser = { id: 'user1', email: 'test@example.com' } as User;
      const mockInvitation = {
        email: 'test@example.com',
        roleAccess: RoleAccess.READ,
      };
      const mockActivityLog = { id: 123 };
      const mockNotification = {
        id: 456,
        receipient: 'owner@example.com',
        sender: 'test@example.com',
      };

      mockWorkspaceRepository.findOne.mockResolvedValue(mockWorkspace);
      mockWorkspacesSharingInvitationsRepository.create.mockImplementation(
        (data) => data,
      );
      mockWorkspacesSharingInvitationsRepository.save.mockResolvedValue([
        mockInvitation,
      ]);
      mockMemberActivityLogService.create.mockResolvedValue(mockActivityLog);
      mockNotificationService.createNotification.mockResolvedValue(
        mockNotification,
      );
      mockNotificationGateway.sendNotification.mockResolvedValue(null);
      mockMailerService.sendMail.mockResolvedValueOnce(null);

      await service.create(mockUser, {
        workspaceId: 'workspace1',
        sharingMembers: [mockInvitation],
        ownerId: '',
      });

      expect(mockNotificationService.createNotification).toHaveBeenCalled();
      expect(mockNotificationGateway.sendNotification).toHaveBeenCalled();
    });
  });

  describe('confirmInvitation', () => {
    it('should throw INVITATION_NOT_FOUND if invitation does not exist', async () => {
      mockWorkspacesSharingInvitationsRepository.findOne.mockResolvedValue(
        null,
      );

      await expect(
        service.confirmInvitation({ inviteId: 'nonexistent' }),
      ).rejects.toThrow(ErrorCode.INVITATION_NOT_FOUND);
    });

    it('should throw INVALID_LINK_CONFIRM_INVITATION if the invitation is already accepted', async () => {
      const mockInvitation = {
        id: '1',
        email: 'test@example.com',
        status: StatusInvitation.ACCEPTED,
      };
      const mockUser = { id: 'user1', email: 'test@example.com' };

      mockWorkspacesSharingInvitationsRepository.findOne.mockResolvedValue(
        mockInvitation,
      );
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(
        service.confirmInvitation({ inviteId: '1' }),
      ).rejects.toThrow(ErrorCode.INVALID_LINK_CONFIRM_INVITATION);
    });

    it('should throw USER_NOT_FOUND if the user is not found', async () => {
      const mockInvitation = { email: 'test@example.com' };
      mockWorkspacesSharingInvitationsRepository.findOne.mockResolvedValue(
        mockInvitation,
      );
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.confirmInvitation({ inviteId: 'invitation1' }),
      ).rejects.toThrow(ErrorCode.USER_NOT_FOUND);
    });

    it('should accept invitation and save membership if valid', async () => {
      const mockInvitation = {
        id: '1',
        email: 'test@example.com',
        status: StatusInvitation.PENDING,
        roleAccess: RoleAccess.READ,
        workspace: { id: 'workspace1' },
      };
      const mockUser = { id: 'user1', email: 'test@example.com' };
      mockWorkspacesSharingInvitationsRepository.findOne.mockResolvedValue(
        mockInvitation,
      );
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockWorkspacesSharingInvitationsRepository.save.mockResolvedValue(
        mockInvitation,
      );
      mockWorkspacesSharingMembersService.create.mockResolvedValue({
        workspace: mockInvitation.workspace,
        member: mockUser,
        roleAccess: mockInvitation.roleAccess,
      });

      await service.confirmInvitation({ inviteId: '1' });

      expect(workspacesSharingInvitationsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: StatusInvitation.ACCEPTED }),
      );
      expect(mockWorkspacesSharingMembersService.create).toHaveBeenCalledWith({
        workspace: mockInvitation.workspace,
        member: mockUser,
        roleAccess: mockInvitation.roleAccess,
      });
    });
  });

  describe('declineInvitation', () => {
    it('should throw INVITATION_NOT_FOUND if invitation does not exist', async () => {
      mockWorkspacesSharingInvitationsRepository.findOne.mockResolvedValue(
        null,
      );

      await expect(service.declineInvitation('nonexistent')).rejects.toThrow(
        ErrorCode.INVITATION_NOT_FOUND,
      );
    });

    it('should throw USER_NOT_FOUND if user associated with the invitation does not exist', async () => {
      const mockInvitation = {
        id: '1',
        email: 'test@example.com',
        status: StatusInvitation.PENDING,
      };

      mockWorkspacesSharingInvitationsRepository.findOne.mockResolvedValue(
        mockInvitation,
      );
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.declineInvitation('1')).rejects.toThrow(
        ErrorCode.USER_NOT_FOUND,
      );
    });

    it('should throw INVALID_LINK_EMAIL_VERIFICATION if the invitation is already accepted', async () => {
      const mockInvitation = {
        id: '1',
        email: 'test@example.com',
        status: StatusInvitation.ACCEPTED,
      };

      mockWorkspacesSharingInvitationsRepository.findOne.mockResolvedValue(
        mockInvitation,
      );

      mockUserRepository.findOne.mockResolvedValue({ id: 'userId' });

      await expect(service.declineInvitation('1')).rejects.toThrow(
        ErrorCode.INVALID_LINK_EMAIL_VERIFICATION,
      );
    });

    it('should decline invitation successfully', async () => {
      const mockInvitation = {
        id: '1',
        email: 'test@example.com',
        status: StatusInvitation.PENDING,
      };

      mockWorkspacesSharingInvitationsRepository.findOne.mockResolvedValue(
        mockInvitation,
      );
      mockWorkspacesSharingInvitationsRepository.save.mockResolvedValue(
        mockInvitation,
      );
      mockUserRepository.findOne.mockResolvedValue({ id: 'userId' });

      await service.declineInvitation('1');

      expect(workspacesSharingInvitationsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: StatusInvitation.DECLINE }),
      );
    });
  });
});
