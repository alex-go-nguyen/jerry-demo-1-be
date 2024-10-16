import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ErrorCode } from '@/common/enums';

import { EncryptionService } from '@/encryption/encryption.service';

import { Account } from './entities/account.entity';

import { CreateAccountDto, UpdateAccountDto } from './dto';

import { AccountService } from './account.service';

const mockAccountRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  softRemove: jest.fn(),
  restore: jest.fn(),
});

const mockEncryptionService = () => ({
  encryptPassword: jest.fn(),
});

describe('AccountService', () => {
  let service: AccountService;
  let accountRepository: Repository<Account>;
  let encryptionService: EncryptionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountService,
        {
          provide: getRepositoryToken(Account),
          useFactory: mockAccountRepository,
        },
        { provide: EncryptionService, useFactory: mockEncryptionService },
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
    it('should throw an error if required fields are missing', async () => {
      const user = { id: 'user_id' };
      const createAccountData: CreateAccountDto = {
        domain: '',
        username: '',
        password: '',
      };

      await expect(
        service.createAccountService(user, createAccountData),
      ).rejects.toThrow(ErrorCode.MISSING_INPUT);
    });

    it('should create and save an account', async () => {
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
        password: encryptedPassword,
      };
      accountRepository.create = jest.fn().mockReturnValue(newAccount);
      accountRepository.save = jest.fn().mockResolvedValue(newAccount);

      const result = await service.createAccountService(
        user,
        createAccountData,
      );

      expect(result).toEqual(newAccount);
      expect(accountRepository.create).toHaveBeenCalledWith({
        user: user.id,
        domain: createAccountData.domain,
        username: createAccountData.username,
        password: encryptedPassword,
      });
      expect(accountRepository.save).toHaveBeenCalledWith(newAccount);
    });
  });

  describe('getAccountsByUserId', () => {
    it('should return accounts for a given user ID', async () => {
      const userId = 'user_id';
      const mockAccounts = [{ id: 'account1' }, { id: 'account2' }];
      accountRepository.find = jest.fn().mockResolvedValue(mockAccounts);

      const result = await service.getAccountsByUserId(userId);

      expect(result).toEqual(mockAccounts);
      expect(accountRepository.find).toHaveBeenCalledWith({
        where: { user: { id: userId } },
        relations: ['user'],
        select: { user: { id: true } },
      });
    });
  });

  describe('getAccountByUserIdAndAccountId', () => {
    it('should throw an error if account not found', async () => {
      const userId = 'user_id';
      const accountId = 'account_id';
      accountRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(
        service.getAccountByUserIdAndAccountId(userId, accountId),
      ).rejects.toThrow(ErrorCode.ACCOUNT_NOT_FOUND);
    });

    it('should return the account if found', async () => {
      const userId = 'user_id';
      const accountId = 'account_id';
      const mockAccount = { id: accountId, user: { id: userId } };
      accountRepository.findOne = jest.fn().mockResolvedValue(mockAccount);

      const result = await service.getAccountByUserIdAndAccountId(
        userId,
        accountId,
      );

      expect(result).toEqual(mockAccount);
      expect(accountRepository.findOne).toHaveBeenCalledWith({
        where: { id: accountId, user: { id: userId } },
        relations: ['user'],
        select: { user: { id: true } },
      });
    });
  });

  describe('updateAccount', () => {
    it('should throw an error if required fields are missing', async () => {
      const userId = 'user_id';
      const accountId = 'account_id';
      const updateAccountData: UpdateAccountDto = {
        domain: '',
        username: '',
        password: '',
      };

      await expect(
        service.updateAccount(userId, accountId, updateAccountData),
      ).rejects.toThrow(ErrorCode.MISSING_INPUT);
    });

    it('should update and save the account', async () => {
      const userId = 'user_id';
      const accountId = 'account_id';
      const updateAccountData: UpdateAccountDto = {
        domain: 'newdomain.com',
        username: 'newuser',
        password: 'newpassword123',
      };
      const encryptedPassword = 'newEncryptedPassword';
      const existedAccount = {
        id: accountId,
        user: { id: userId },
        password: 'oldPassword',
      };

      jest
        .spyOn(encryptionService, 'encryptPassword')
        .mockReturnValue(encryptedPassword);
      accountRepository.findOne = jest.fn().mockResolvedValue(existedAccount);
      accountRepository.save = jest.fn().mockResolvedValue({
        ...existedAccount,
        ...updateAccountData,
        password: encryptedPassword,
      });

      const result = await service.updateAccount(
        userId,
        accountId,
        updateAccountData,
      );

      expect(result).toEqual({
        ...existedAccount,
        ...updateAccountData,
        password: encryptedPassword,
      });
      expect(accountRepository.save).toHaveBeenCalledWith({
        ...existedAccount,
        ...updateAccountData,
        password: encryptedPassword,
      });
    });
  });

  describe('softRemove', () => {
    it('should throw an error if required fields are missing', async () => {
      await expect(service.softRemove('', 'account_id')).rejects.toThrow(
        ErrorCode.MISSING_INPUT,
      );
      await expect(service.softRemove('user_id', '')).rejects.toThrow(
        ErrorCode.MISSING_INPUT,
      );
    });

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
