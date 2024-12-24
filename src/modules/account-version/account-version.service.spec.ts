import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';

import { ErrorCode } from '@/common/enums';

import { AccountVersionService } from './account-version.service';
import { AccountVersion } from './entities/account-version.entity';

describe('AccountVersionService', () => {
  let service: AccountVersionService;
  let accountVersionRepository: Repository<AccountVersion>;

  const mockAccountVersionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountVersionService,
        {
          provide: getRepositoryToken(AccountVersion),
          useValue: mockAccountVersionRepository,
        },
      ],
    }).compile();

    service = module.get<AccountVersionService>(AccountVersionService);
    accountVersionRepository = module.get<Repository<AccountVersion>>(
      getRepositoryToken(AccountVersion),
    );
  });

  describe('create', () => {
    it('should create and save a new account version', async () => {
      const dto = {
        accountId: 'account-id',
        actorId: 'actor-id',
        domain: 'example.com',
        username: 'user123',
        password: 'password123',
      };

      const savedAccountVersion = {
        id: 'version-id',
        ...dto,
        account: { id: dto.accountId },
        actor: { id: dto.actorId },
      };

      mockAccountVersionRepository.create.mockReturnValue(savedAccountVersion);
      mockAccountVersionRepository.save.mockResolvedValue(savedAccountVersion);

      const result = await service.create(dto);
      expect(accountVersionRepository.create).toHaveBeenCalledWith({
        ...dto,
        account: { id: dto.accountId },
        actor: { id: dto.actorId },
      });
      expect(accountVersionRepository.save).toHaveBeenCalledWith(
        savedAccountVersion,
      );
      expect(result).toEqual(savedAccountVersion);
    });
  });

  describe('getAccountVersions', () => {
    it('should return a list of account versions', async () => {
      const accountId = 'account-id';
      const mockVersions = [
        { id: 'version1', domain: 'example1.com', actor: { name: 'User1' } },
        { id: 'version2', domain: 'example2.com', actor: { name: 'User2' } },
      ];

      mockAccountVersionRepository.find.mockResolvedValue(mockVersions);

      const result = await service.getAccountVersions(accountId);
      expect(accountVersionRepository.find).toHaveBeenCalledWith({
        where: { account: { id: accountId } },
        relations: ['actor'],
        select: {
          actor: { name: true, email: true, avatar: true },
        },
        order: { createdAt: 'ASC' },
      });
      expect(result).toEqual(mockVersions);
    });
  });

  describe('findOne', () => {
    it('should return the account version if found', async () => {
      const versionId = 'version-id';
      const ownerId = 'owner-id';
      const mockAccountVersion = {
        id: versionId,
        account: { owner: { id: ownerId } },
      };

      mockAccountVersionRepository.findOne.mockResolvedValue(
        mockAccountVersion,
      );

      const result = await service.findOne(versionId, ownerId);
      expect(mockAccountVersionRepository.findOne).toHaveBeenCalledWith({
        where: { id: versionId, account: { owner: { id: ownerId } } },
        relations: ['account'],
      });
      expect(result).toEqual(mockAccountVersion);
    });

    it('should throw an error if the account version is not found', async () => {
      mockAccountVersionRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid-id', 'owner-id')).rejects.toThrow(
        ErrorCode.ACCOUNT_VERSION_NOT_FOUND,
      );
    });
  });

  describe('remove', () => {
    it('should remove the account version if found', async () => {
      const versionId = 'version-id';
      const ownerId = 'owner-id';
      const mockAccountVersion = {
        id: versionId,
        account: { owner: { id: ownerId } },
      };

      mockAccountVersionRepository.findOne.mockResolvedValue(
        mockAccountVersion,
      );
      mockAccountVersionRepository.remove.mockResolvedValue(mockAccountVersion);

      const result = await service.remove(versionId, ownerId);
      expect(mockAccountVersionRepository.findOne).toHaveBeenCalledWith({
        where: { id: versionId, account: { owner: { id: ownerId } } },
        relations: ['account'],
      });
      expect(mockAccountVersionRepository.remove).toHaveBeenCalledWith(
        mockAccountVersion,
      );
      expect(result).toEqual(mockAccountVersion);
    });

    it('should throw an error if the account version is not found', async () => {
      mockAccountVersionRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('invalid-id', 'owner-id')).rejects.toThrow(
        ErrorCode.ACCOUNT_VERSION_NOT_FOUND,
      );
    });
  });
});
