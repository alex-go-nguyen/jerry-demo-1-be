import { Brackets, In, Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { WorkspaceService } from './workspace.service';

import {
  ActivityType,
  EntityType,
  ErrorCode,
  RoleAccess,
} from '@/common/enums';
import { User } from '@/modules/user/entities/user.entity';
import { Account } from '@/modules/account/entities/account.entity';
import { NotificationService } from '@/modules/notification/notification.service';
import { NotificationGateway } from '@/modules/notification/notification.gateway';
import { MemberActivityLogService } from '@/modules/member-activity-log/member-activity-log.service';
import { AccountsSharingMembers } from '@/modules/accounts-sharing-members/entities/accounts-sharing-members.entity';
import { WorkspacesSharingMembersService } from '@/modules/workspaces-sharing-members/workspaces-sharing-members.service';
import { WorkspacesSharingMembers } from '@/modules/workspaces-sharing-members/entities/workspaces-sharing-members.entity';

import { Workspace } from './entities/workspace.entity';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';

describe('WorkspaceService', () => {
  let service: WorkspaceService;
  let workspaceRepository: Repository<Workspace>;
  let userRepository: Repository<User>;
  let accountRepository: Repository<Account>;

  const mockUser = { id: 'user-id', name: 'User Name' } as User;

  const mockOwner = {
    id: 'owner-id',
    name: 'Owner Name',
    email: 'owner@example.com',
    avatar: 'owner-avatar',
  } as User;

  const mockAccount = {
    id: 'account-id',
    username: 'Account User',
    domain: 'example.com',
    password: 'password',
    owner: mockOwner,
  } as Account;

  const mockAccount1 = {
    id: 'account-id-1',
    username: 'Account User 1',
    domain: 'example.com',
    password: 'password',
    owner: mockOwner,
  } as Account;

  const mockAccount2 = {
    id: 'account-id-2',
    username: 'Account User 2',
    domain: 'example.com',
    password: 'password',
    owner: mockOwner,
  } as Account;

  const mockWorkspace = {
    id: 'workspace-id',
    name: 'Workspace Name',
    owner: mockOwner,
    accounts: [mockAccount, mockAccount1, mockAccount2],
    members: [],
  } as Workspace;

  const updateWorkspaceDto: UpdateWorkspaceDto = {
    name: 'Updated Workspace Name',
    accounts: ['account-id-1', 'account-id-2'],
  };

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[mockWorkspace], 1]),
  };

  const mockWorkspaceRepository = {
    create: jest.fn().mockReturnValue(mockWorkspace),
    save: jest.fn().mockResolvedValue(mockWorkspace),
    find: jest.fn(),
    findOne: jest.fn(),
    softRemove: jest.fn(),
    delete: jest.fn(),
    restore: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  const mockUserRepository = {
    findOneBy: jest.fn(),
  };

  const mockAccountRepository = {
    find: jest.fn().mockResolvedValue([mockAccount]),
  };

  const mockWorkspacesSharingMembersRepository = {
    delete: jest.fn(),
  };

  const mockAccountsSharingMembersRepository = {
    delete: jest.fn(),
  };

  const mockWorkspacesSharingMembersService = {
    updateAccountsSharingFromWorkspace: jest.fn(),
  };

  const mockMemberActivityLogService = {
    create: jest.fn(),
  };

  const mockNotificationGateway = {
    sendNotification: jest.fn(),
  };

  const mockNotificationService = {
    createNotification: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspaceService,
        {
          provide: getRepositoryToken(Workspace),
          useValue: mockWorkspaceRepository,
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
          provide: getRepositoryToken(WorkspacesSharingMembers),
          useValue: mockWorkspacesSharingMembersRepository,
        },
        {
          provide: getRepositoryToken(AccountsSharingMembers),
          useValue: mockAccountsSharingMembersRepository,
        },
        {
          provide: WorkspacesSharingMembersService,
          useValue: mockWorkspacesSharingMembersService,
        },
        {
          provide: MemberActivityLogService,
          useValue: mockMemberActivityLogService,
        },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: NotificationGateway, useValue: mockNotificationGateway },
      ],
    }).compile();

    service = module.get<WorkspaceService>(WorkspaceService);
    workspaceRepository = module.get<Repository<Workspace>>(
      getRepositoryToken(Workspace),
    );
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    accountRepository = module.get<Repository<Account>>(
      getRepositoryToken(Account),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a workspace', async () => {
      const createWorkspaceDto: CreateWorkspaceDto = {
        name: 'New Workspace',
        accounts: [mockAccount.id],
      };

      jest.spyOn(mockUserRepository, 'findOneBy').mockResolvedValue(mockUser);
      jest
        .spyOn(mockAccountRepository, 'find')
        .mockResolvedValue([mockAccount]);

      await service.create(mockUser.id, createWorkspaceDto);

      expect(mockWorkspaceRepository.create).toHaveBeenCalledWith({
        name: createWorkspaceDto.name,
        owner: mockUser,
        accounts: [mockAccount],
      });
      expect(mockWorkspaceRepository.save).toHaveBeenCalledWith(mockWorkspace);
    });

    it('should throw an error if user does not exist', async () => {
      const createWorkspaceDto: CreateWorkspaceDto = {
        name: 'New Workspace',
        accounts: [mockAccount.id],
      };

      jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(null);

      await expect(
        service.create('invalid-user-id', createWorkspaceDto),
      ).rejects.toThrow(ErrorCode.USER_NOT_FOUND);
    });
  });

  describe('getWorkspacesByUserId', () => {
    const queryParams = { page: 1, limit: 10, keyword: 'Workspace' };

    it('should return paginated workspaces where the user is the owner or a member', async () => {
      const result = await service.getWorkspacesByUserId(
        'user-id',
        queryParams,
      );

      expect(workspaceRepository.createQueryBuilder).toHaveBeenCalledWith(
        'workspace',
      );

      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'workspace.owner',
        'owner',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'workspace.members',
        'members',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'members.member',
        'member',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'workspace.accounts',
        'accounts',
      );

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'workspace.name ILIKE :keyword',
        { keyword: `%${queryParams.keyword}%` },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.any(Brackets),
      );
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);

      expect(result).toEqual({
        workspaces: [
          {
            ...mockWorkspace,
            members: [],
          },
        ],
        totalPages: 1,
        itemsPerPage: 10,
      });
    });

    it('should return an empty list when no workspaces are found for the user', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValueOnce([[], 0]);

      const result = await service.getWorkspacesByUserId(
        'non-existent-user-id',
        queryParams,
      );

      expect(result).toEqual({
        workspaces: [],
        totalPages: 0,
        itemsPerPage: 10,
      });
    });
  });

  describe('findOne', () => {
    it('should return workspace with members when workspace is found', async () => {
      jest
        .spyOn(mockWorkspaceRepository, 'findOne')
        .mockResolvedValue(mockWorkspace);

      const result = await service.findOne('workspace-id');

      expect(mockWorkspaceRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'workspace-id' },
        relations: ['owner', 'members', 'accounts', 'members.member'],
        select: {
          id: true,
          name: true,
          createdAt: true,
          owner: { id: true, name: true, email: true, avatar: true },
        },
      });

      expect(result).toEqual(mockWorkspace);
    });

    it('should throw an error if workspace is not found', async () => {
      jest.spyOn(mockWorkspaceRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        ErrorCode.WORKSPACE_NOT_FOUND,
      );
    });
  });

  describe('update', () => {
    it('should update workspace name and accounts when the data is valid', async () => {
      jest
        .spyOn(mockWorkspaceRepository, 'findOne')
        .mockResolvedValue(mockWorkspace);
      jest
        .spyOn(mockAccountRepository, 'find')
        .mockResolvedValue([mockAccount2]);

      jest
        .spyOn(mockMemberActivityLogService, 'create')
        .mockResolvedValue({ id: 'activity-log-id' } as any);

      jest
        .spyOn(mockWorkspaceRepository, 'save')
        .mockResolvedValue(mockWorkspace);

      await service.update('workspace-id', mockUser, updateWorkspaceDto);

      expect(
        mockWorkspacesSharingMembersService.updateAccountsSharingFromWorkspace,
      ).toHaveBeenCalledWith({
        workspaceId: 'workspace-id',
        newAccountIds: expect.any(Array),
        removedAccountIds: expect.any(Array),
        userId: 'user-id',
      });
      expect(mockWorkspace.name).toBe(updateWorkspaceDto.name);
      expect(mockWorkspaceRepository.save).toHaveBeenCalledWith(mockWorkspace);
    });

    it('should update workspace name and accounts when the data is valid', async () => {
      jest
        .spyOn(mockWorkspaceRepository, 'findOne')
        .mockResolvedValue(mockWorkspace);
      jest
        .spyOn(mockAccountRepository, 'find')
        .mockResolvedValue([mockAccount2]);

      await service.update('workspace-id', mockUser, updateWorkspaceDto);
      jest
        .spyOn(mockMemberActivityLogService, 'create')
        .mockResolvedValue({ id: 'activity-log-id' } as any);

      expect(
        mockWorkspacesSharingMembersService.updateAccountsSharingFromWorkspace,
      ).toHaveBeenCalledWith({
        workspaceId: 'workspace-id',
        newAccountIds: expect.any(Array),
        removedAccountIds: expect.any(Array),
        userId: 'user-id',
      });

      expect(mockWorkspace.name).toBe(updateWorkspaceDto.name);
      expect(mockWorkspaceRepository.save).toHaveBeenCalledWith(mockWorkspace);
    });

    it('should create an activity log and send a notification if the user is not the workspace owner', async () => {
      jest
        .spyOn(mockWorkspaceRepository, 'findOne')
        .mockResolvedValue(mockWorkspace);
      jest
        .spyOn(mockAccountRepository, 'find')
        .mockResolvedValue([mockAccount2]);
      jest
        .spyOn(mockMemberActivityLogService, 'create')
        .mockResolvedValue({ id: 'activity-log-id' } as any);
      jest
        .spyOn(mockNotificationService, 'createNotification')
        .mockResolvedValue({
          id: 'notification-id',
          receipient: mockOwner.email,
        } as any);

      await service.update('workspace-id', mockUser, updateWorkspaceDto);

      expect(mockMemberActivityLogService.create).toHaveBeenCalledWith({
        workspaceId: mockWorkspace.id,
        entityType: EntityType.WORKSPACE,
        action: RoleAccess.UPDATE,
      });

      if (mockUser.id !== mockWorkspace.owner.id) {
        await mockMemberActivityLogService.create({
          workspaceId: mockWorkspace.id,
          entityType: EntityType.WORKSPACE,
          action: RoleAccess.UPDATE,
        });

        await mockNotificationService.createNotification({
          receipient: mockOwner.email,
          sender: mockUser,
          activityType: ActivityType.UPDATE_AN_WORKSPACE,
          activityLogId: 'activity-log-id',
        });

        await mockNotificationGateway.sendNotification();
      }
    });

    it('should not create an activity log or send a notification if the user is the workspace owner', async () => {
      jest
        .spyOn(workspaceRepository, 'findOne')
        .mockResolvedValue(mockWorkspace);
      jest.spyOn(accountRepository, 'find').mockResolvedValue([mockAccount2]);
      jest
        .spyOn(mockMemberActivityLogService, 'create')
        .mockResolvedValue({ id: 'activity-log-id' } as any);

      await service.update('workspace-id', mockOwner, updateWorkspaceDto);

      expect(mockMemberActivityLogService.create).not.toHaveBeenCalled();
      expect(mockNotificationService.createNotification).not.toHaveBeenCalled();
      expect(mockNotificationGateway.sendNotification).not.toHaveBeenCalled();
    });
  });

  describe('softRemove', () => {
    it('should soft remove a workspace', async () => {
      const ownerId = mockUser.id;
      const workspaceId = mockWorkspace.id;

      jest
        .spyOn(mockWorkspaceRepository, 'findOne')
        .mockResolvedValue(mockWorkspace);

      jest
        .spyOn(mockAccountsSharingMembersRepository, 'delete')
        .mockResolvedValue({ affected: 1 });
      jest
        .spyOn(mockWorkspaceRepository, 'softRemove')
        .mockResolvedValue(mockWorkspace);

      await service.softRemove(ownerId, workspaceId);

      expect(workspaceRepository.softRemove).toHaveBeenCalledWith(
        mockWorkspace,
      );

      expect(
        mockWorkspacesSharingMembersRepository.delete,
      ).toHaveBeenCalledWith({
        workspaceId,
      });

      const accountIds = mockWorkspace.accounts.map((account) => account.id);
      const memberIds = mockWorkspace.members.map((member) => member.member.id);
      expect(mockAccountsSharingMembersRepository.delete).toHaveBeenCalledWith({
        accountId: In(accountIds),
        memberId: In(memberIds),
      });
    });

    it('should throw an error if workspace does not exist', async () => {
      const ownerId = mockUser.id;
      const workspaceId = 'invalid-workspace-id';

      jest.spyOn(workspaceRepository, 'findOne').mockResolvedValue(null);

      await expect(service.softRemove(ownerId, workspaceId)).rejects.toThrow(
        ErrorCode.WORKSPACE_NOT_FOUND,
      );
    });
  });

  describe('restore', () => {
    it('should restore a workspace', async () => {
      const workspaceId = mockWorkspace.id;

      await service.restore(workspaceId);

      expect(workspaceRepository.restore).toHaveBeenCalledWith({
        id: workspaceId,
      });
    });
  });
});
