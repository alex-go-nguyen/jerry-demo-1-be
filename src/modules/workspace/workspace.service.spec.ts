import { Test, TestingModule } from '@nestjs/testing';
import { WorkspaceService } from './workspace.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ErrorCode } from '@/common/enums';

import { User } from '@/modules/user/entities/user.entity';
import { Account } from '@/modules/account/entities/account.entity';

import { Workspace } from './entities/workspace.entity';

import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';

describe('WorkspaceService', () => {
  let service: WorkspaceService;
  let workspaceRepository: Repository<Workspace>;
  let userRepository: Repository<User>;
  let accountRepository: Repository<Account>;

  const mockUser = { id: 'user-id', name: 'User Name' } as User;
  const mockAccount = {
    id: 'account-id',
    username: 'Account User',
    domain: 'example.com',
    password: 'password',
  } as Account;
  const mockWorkspace = {
    id: 'workspace-id',
    name: 'Workspace Name',
    owner: mockUser,
    accounts: [mockAccount],
  } as Workspace;

  const mockWorkspaceRepository = {
    create: jest.fn().mockReturnValue(mockWorkspace),
    save: jest.fn().mockResolvedValue(mockWorkspace),
    findOne: jest.fn(),
    softRemove: jest.fn(),
    restore: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([mockWorkspace]),
    }),
  };

  const mockUserRepository = {
    findOneBy: jest.fn(),
  };

  const mockAccountRepository = {
    find: jest.fn().mockResolvedValue([mockAccount]),
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
        userId: mockUser.id,
        accounts: [mockAccount.id],
      };

      jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(mockUser);
      jest.spyOn(accountRepository, 'find').mockResolvedValue([mockAccount]);

      const result = await service.create(createWorkspaceDto);

      expect(workspaceRepository.create).toHaveBeenCalledWith({
        name: createWorkspaceDto.name,
        owner: mockUser,
        accounts: [mockAccount],
      });
      expect(result).toEqual(mockWorkspace);
    });

    it('should throw an error if name is missing', async () => {
      const createWorkspaceDto: CreateWorkspaceDto = {
        name: '',
        userId: mockUser.id,
        accounts: [mockAccount.id],
      };

      await expect(service.create(createWorkspaceDto)).rejects.toThrow(
        ErrorCode.MISSING_INPUT,
      );
    });

    it('should throw an error if user does not exist', async () => {
      const createWorkspaceDto: CreateWorkspaceDto = {
        name: 'New Workspace',
        userId: 'invalid-user-id',
        accounts: [mockAccount.id],
      };

      jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(null);

      await expect(service.create(createWorkspaceDto)).rejects.toThrow(
        ErrorCode.USER_NOT_FOUND,
      );
    });
  });

  describe('getWorkspacesByUserId', () => {
    it('should return workspaces by user ID', async () => {
      const userId = mockUser.id;

      const result = await service.getWorkspacesByUserId(userId);

      expect(workspaceRepository.createQueryBuilder).toHaveBeenCalled();
      expect(result).toEqual([mockWorkspace]);
    });
  });

  describe('update', () => {
    it('should update a workspace', async () => {
      const updateWorkspaceDto: UpdateWorkspaceDto = {
        workspaceId: mockWorkspace.id,
        name: 'Updated Workspace',
        userId: mockUser.id,
        accounts: [mockAccount.id],
      };

      jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(mockUser);
      jest
        .spyOn(workspaceRepository, 'findOne')
        .mockResolvedValue(mockWorkspace);
      jest.spyOn(accountRepository, 'find').mockResolvedValue([mockAccount]);

      const result = await service.update(updateWorkspaceDto);

      expect(workspaceRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: updateWorkspaceDto.workspaceId,
          owner: { id: updateWorkspaceDto.userId },
        },
        relations: ['owner', 'accounts'],
      });
      expect(result).toEqual(mockWorkspace);
    });

    it('should throw an error if workspace does not exist', async () => {
      const updateWorkspaceDto: UpdateWorkspaceDto = {
        workspaceId: 'invalid-workspace-id',
        name: 'Updated Workspace',
        userId: mockUser.id,
        accounts: [mockAccount.id],
      };

      jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(mockUser);
      jest.spyOn(workspaceRepository, 'findOne').mockResolvedValue(null);

      await expect(service.update(updateWorkspaceDto)).rejects.toThrow(
        ErrorCode.WORKSPACE_NOT_FOUND,
      );
    });
  });

  describe('softRemove', () => {
    it('should soft remove a workspace', async () => {
      const ownerId = mockUser.id;
      const workspaceId = mockWorkspace.id;

      jest
        .spyOn(workspaceRepository, 'findOne')
        .mockResolvedValue(mockWorkspace);

      await service.softRemove(ownerId, workspaceId);

      expect(workspaceRepository.softRemove).toHaveBeenCalledWith(
        mockWorkspace,
      );
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
