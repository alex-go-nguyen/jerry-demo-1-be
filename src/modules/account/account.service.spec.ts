import { Brackets, Repository } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import {
  ActivityType,
  EntityType,
  ErrorCode,
  RoleAccess,
} from '@/common/enums';
import { User } from '@/modules/user/entities/user.entity';
import { EncryptionService } from '@/encryption/encryption.service';
import { NotificationService } from '@/modules/notification/notification.service';
import { NotificationGateway } from '@/modules/notification/notification.gateway';
import { AccountVersionService } from '@/modules/account-version/account-version.service';
import { MemberActivityLogService } from '@/modules/member-activity-log/member-activity-log.service';

import { AccountService } from './account.service';
import { Account } from './entities/account.entity';
import { CreateAccountDto, UpdateAccountDto } from './dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';

describe('AccountService', () => {
  let service: AccountService;
  let accountRepository: Repository<Account>;
  let encryptionService: EncryptionService;

  const mockAccounts = [
    {
      id: 'account1',
      domain: 'example1.com',
      username: 'user1',
      password: 'password1',
      owner: {
        id: 'owner1',
        name: 'Owner One',
        email: 'owner1@example.com',
        avatar: 'owner1-avatar.jpg',
      },
      members: [
        {
          roleAccess: 'admin',
          member: {
            id: 'member1',
            name: 'Member One',
            email: 'member1@example.com',
            avatar: 'member1-avatar.jpg',
          },
        },
      ],
    },
    {
      id: 'account2',
      domain: 'example2.com',
      username: 'user2',
      password: 'password2',
      owner: {
        id: 'owner2',
        name: 'Owner Two',
        email: 'owner2@example.com',
        avatar: 'owner2-avatar.jpg',
      },
      members: [],
    },
  ];

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([mockAccounts, 1]),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    create: jest.fn(),
  };

  const mockAccountRepository = () => ({
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    softRemove: jest.fn(),
    restore: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  });

  const mockEncryptionService = {
    encryptPassword: jest.fn(),
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

  const mockAccountVersionService = {
    save: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountService,
        {
          provide: getRepositoryToken(Account),
          useFactory: mockAccountRepository,
        },
        { provide: EncryptionService, useValue: mockEncryptionService },
        {
          provide: MemberActivityLogService,
          useValue: mockMemberActivityLogService,
        },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: NotificationGateway, useValue: mockNotificationGateway },
        { provide: AccountVersionService, useValue: mockAccountVersionService },
      ],
    }).compile();

    service = module.get<AccountService>(AccountService);
    accountRepository = module.get<Repository<Account>>(
      getRepositoryToken(Account),
    );
    encryptionService = module.get<EncryptionService>(EncryptionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createAccountService', () => {
    it('should create and save an account with the correct data', async () => {
      const user = { id: 'user_id' };
      const createAccountData: CreateAccountDto = {
        domain: 'example.com',
        username: 'testuser',
        password: 'password123',
      };
      const encryptedPassword = 'encryptedPassword';

      jest
        .spyOn(encryptionService, 'encryptPassword')
        .mockReturnValue(encryptedPassword);

      const newAccount = {
        id: 'new_account_id',
        ...createAccountData,
        owner: user.id,
        password: encryptedPassword,
      };

      accountRepository.create = jest.fn().mockReturnValue(newAccount);
      accountRepository.save = jest.fn().mockResolvedValue(newAccount);

      await service.createAccountService(user, createAccountData);

      expect(mockEncryptionService.encryptPassword).toHaveBeenCalledWith(
        createAccountData.password,
      );
      expect(accountRepository.create).toHaveBeenCalledWith({
        owner: user.id,
        domain: createAccountData.domain,
        username: createAccountData.username,
        password: encryptedPassword,
      });
      expect(accountRepository.save).toHaveBeenCalledWith(newAccount);
    });
  });

  describe('getAccountsByUserId', () => {
    it('should return accounts with pagination for a given user ID', async () => {
      const userId = 'user_id';
      const query: PaginationQueryDto = {
        page: 1,
        limit: 10,
        keyword: 'test',
      };
      const result = await service.getAccountsByUserId(userId, query);

      const expectedResult = {
        accounts: [
          {
            id: 'account1',
            domain: 'example1.com',
            members: [
              {
                roleAccess: 'admin',
                id: 'member1',
                name: 'Member One',
                email: 'member1@example.com',
                avatar: 'member1-avatar.jpg',
              },
            ],
            owner: {
              id: 'owner1',
              name: 'Owner One',
              email: 'owner1@example.com',
              avatar: 'owner1-avatar.jpg',
            },
            password: 'password1',
            username: 'user1',
          },
          {
            id: 'account2',
            domain: 'example2.com',
            members: [],
            owner: {
              id: 'owner2',
              name: 'Owner Two',
              email: 'owner2@example.com',
              avatar: 'owner2-avatar.jpg',
            },
            password: 'password2',
            username: 'user2',
          },
        ],
        totalPages: 1,
        itemsPerPage: 10,
      };

      expect(result).toEqual(expectedResult);
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledTimes(3);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        '(account.username ILIKE :keyword OR account.domain ILIKE :keyword)',
        { keyword: `%${query.keyword}%` },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.any(Brackets),
      );

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.getManyAndCount).toHaveBeenCalled();
    });
  });

  describe('getAccountById', () => {
    it('should throw an error if the account is not found', async () => {
      const accountId = 'account_id';

      accountRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.getAccountById(accountId)).rejects.toThrow(
        ErrorCode.ACCOUNT_NOT_FOUND,
      );

      expect(accountRepository.findOne).toHaveBeenCalledWith({
        where: { id: accountId },
        relations: ['owner', 'members', 'members.member'],
        select: {
          id: true,
          domain: true,
          username: true,
          password: true,
          owner: { id: true, name: true, email: true, avatar: true },
        },
      });
    });

    it('should return the account with transformed members if found', async () => {
      const accountId = 'account_id';

      const mockAccount = {
        id: accountId,
        domain: 'example.com',
        username: 'user123',
        password: 'encrypted_password',
        owner: {
          id: 'owner_id',
          name: 'Owner Name',
          email: 'owner@example.com',
          avatar: 'owner-avatar.jpg',
        },
        members: [
          {
            roleAccess: 'admin',
            member: {
              id: 'member_id1',
              name: 'Member One',
              email: 'member1@example.com',
              avatar: 'member1-avatar.jpg',
            },
          },
          {
            roleAccess: 'viewer',
            member: {
              id: 'member_id2',
              name: 'Member Two',
              email: 'member2@example.com',
              avatar: 'member2-avatar.jpg',
            },
          },
        ],
      };

      const transformedAccount = {
        ...mockAccount,
        members: mockAccount.members.map((member) => ({
          id: member.member.id,
          name: member.member.name,
          email: member.member.email,
          avatar: member.member.avatar,
          roleAccess: member.roleAccess,
        })),
      };

      accountRepository.findOne = jest.fn().mockResolvedValue(mockAccount);

      const result = await service.getAccountById(accountId);

      expect(result).toEqual(transformedAccount);

      expect(accountRepository.findOne).toHaveBeenCalledWith({
        where: { id: accountId },
        relations: ['owner', 'members', 'members.member'],
        select: {
          id: true,
          domain: true,
          username: true,
          password: true,
          owner: { id: true, name: true, email: true, avatar: true },
        },
      });
    });
  });

  describe('updateAccount', () => {
    it('should throw an error if the account is not found', async () => {
      const user = { id: 'user_id' } as User;
      const accountId = 'account_id';
      const updateAccountData: UpdateAccountDto = {
        domain: 'newdomain.com',
        username: 'newuser',
        password: 'newpassword123',
      };

      accountRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(
        service.updateAccount(user, accountId, updateAccountData),
      ).rejects.toThrow(ErrorCode.ACCOUNT_NOT_FOUND);

      expect(accountRepository.findOne).toHaveBeenCalledWith({
        where: { id: accountId },
        relations: ['owner', 'members'],
      });
    });

    it('should update the account if the user is the owner', async () => {
      const user = { id: 'owner_id' } as User;
      const accountId = 'account_id';
      const updateAccountData: UpdateAccountDto = {
        domain: 'newdomain.com',
        username: 'newuser',
        password: 'newpassword123',
      };
      const encryptedPassword = 'encryptedPassword123';
      const existedAccount = {
        id: accountId,
        owner: { id: user.id },
        members: [],
      };

      jest
        .spyOn(encryptionService, 'encryptPassword')
        .mockReturnValue(encryptedPassword);
      accountRepository.findOne = jest.fn().mockResolvedValue(existedAccount);
      accountRepository.update = jest.fn().mockResolvedValue(undefined);

      await service.updateAccount(user, accountId, updateAccountData);

      expect(accountRepository.update).toHaveBeenCalledWith(accountId, {
        domain: updateAccountData.domain,
        username: updateAccountData.username,
        password: encryptedPassword,
      });
      expect(mockEncryptionService.encryptPassword).toHaveBeenCalledWith(
        updateAccountData.password,
      );
    });

    it('should log activity and send notification if the user is not the owner', async () => {
      const user = { id: 'member_id', email: 'member@example.com' } as User;
      const accountId = 'account_id';
      const updateAccountData: UpdateAccountDto = {
        domain: 'newdomain.com',
        username: 'newuser',
        password: 'newpassword123',
      };
      const encryptedPassword = 'encryptedPassword123';
      const existedAccount = {
        id: accountId,
        owner: { id: 'owner_id', email: 'owner@example.com' },
        members: [{ member: { id: user.id }, roleAccess: 'editor' }],
      };

      const mockActivityLog = {
        id: 'activity_log_id',
        entityType: EntityType.ACCOUNT,
        action: RoleAccess.UPDATE,
        createdAt: new Date(),
      };
      const mockNotification = { id: 'notification_id' };

      jest
        .spyOn(encryptionService, 'encryptPassword')
        .mockReturnValue(encryptedPassword);
      accountRepository.findOne = jest.fn().mockResolvedValue(existedAccount);
      accountRepository.update = jest.fn().mockResolvedValue(undefined);

      jest
        .spyOn(mockMemberActivityLogService, 'create')
        .mockResolvedValue(mockActivityLog);
      jest
        .spyOn(mockNotificationService, 'createNotification')
        .mockResolvedValue(mockNotification);
      jest
        .spyOn(mockNotificationGateway, 'sendNotification')
        .mockResolvedValue(undefined);

      await service.updateAccount(user, accountId, updateAccountData);

      expect(mockMemberActivityLogService.create).toHaveBeenCalledWith({
        accountId: existedAccount.id,
        entityType: EntityType.ACCOUNT,
        action: RoleAccess.UPDATE,
      });
      expect(mockNotificationService.createNotification).toHaveBeenCalledWith({
        receipient: existedAccount.owner.email,
        sender: user,
        activityType: ActivityType.UPDATE_AN_ACCOUNT,
        activityLogId: mockActivityLog.id,
      });
      expect(mockNotificationGateway.sendNotification).toHaveBeenCalledWith(
        mockNotification,
      );
    });
  });

  describe('rollbackToVersion', () => {
    it('should throw an error if the account version is not found', async () => {
      const ownerId = 'owner1';
      const versionId = 'version1';

      mockAccountVersionService.findOne = jest.fn().mockResolvedValue(null);

      await expect(
        service.rollbackToVersion(ownerId, versionId),
      ).rejects.toThrow(ErrorCode.ACCOUNT_VERSION_NOT_FOUND);

      expect(mockAccountVersionService.findOne).toHaveBeenCalledWith(
        versionId,
        ownerId,
      );
    });

    it('should rollback to the specified version', async () => {
      const ownerId = 'owner1';
      const versionId = 'version1';

      const mockAccountVersion = {
        id: versionId,
        account: { id: 'account1' },
        domain: 'newdomain.com',
        username: 'newuser',
        password: 'newpassword123',
      };

      mockAccountVersionService.findOne = jest
        .fn()
        .mockResolvedValue(mockAccountVersion);

      accountRepository.update = jest.fn().mockResolvedValue(undefined);

      mockAccountVersionService.remove = jest.fn().mockResolvedValue(undefined);

      await service.rollbackToVersion(ownerId, versionId);

      expect(accountRepository.update).toHaveBeenCalledWith(
        mockAccountVersion.account.id,
        {
          domain: mockAccountVersion.domain,
          username: mockAccountVersion.username,
          password: mockAccountVersion.password,
        },
      );

      expect(mockAccountVersionService.remove).toHaveBeenCalledWith(
        versionId,
        ownerId,
      );
    });
  });

  describe('softRemove', () => {
    it('should throw an error if account not found', async () => {
      const userId = 'user_id';
      const accountId = 'account_id';
      accountRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.softRemove(userId, accountId)).rejects.toThrow(
        ErrorCode.ACCOUNT_NOT_FOUND,
      );
    });

    it('should soft remove the account', async () => {
      const userId = 'user_id';
      const accountId = 'account_id';
      const existedAccount = { id: accountId, user: { id: userId } };
      accountRepository.findOne = jest.fn().mockResolvedValue(existedAccount);

      await service.softRemove(userId, accountId);

      expect(accountRepository.softRemove).toHaveBeenCalledWith(existedAccount);
    });
  });

  describe('restore', () => {
    it('should restore the account', async () => {
      const accountId = 'account_id';

      await service.restore(accountId);

      expect(accountRepository.restore).toHaveBeenCalledWith({ id: accountId });
    });
  });
});
