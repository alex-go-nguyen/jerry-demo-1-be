import * as bcrypt from 'bcryptjs';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { ErrorCode, StatusTwoFa } from '@/common/enums';

import { HighLevelPasswordService } from './high-level-password.service';
import { HighLevelPassword } from './entities/high-level-password.entity';

describe('HighLevelPasswordService', () => {
  let service: HighLevelPasswordService;

  const mockHighLevelPasswordRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HighLevelPasswordService,
        {
          provide: getRepositoryToken(HighLevelPassword),
          useValue: mockHighLevelPasswordRepository,
        },
      ],
    }).compile();

    service = module.get<HighLevelPasswordService>(HighLevelPasswordService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new high level password and save it to the repository', async () => {
      const userId = 'user-id';
      const createHighLevelPasswordData = { password: 'password123' };

      const mockedHash = 'mocked-hash';
      jest.spyOn(bcrypt, 'hash').mockResolvedValue(mockedHash as never);

      const newHighLevelPassword = {
        ...createHighLevelPasswordData,
        user: { id: userId },
        password: mockedHash,
      };

      mockHighLevelPasswordRepository.create.mockReturnValue(
        newHighLevelPassword,
      );
      mockHighLevelPasswordRepository.save.mockResolvedValue(
        newHighLevelPassword,
      );

      const result = await service.create(userId, createHighLevelPasswordData);

      expect(bcrypt.hash).toHaveBeenCalledWith(
        createHighLevelPasswordData.password,
        10,
      );
      expect(mockHighLevelPasswordRepository.create).toHaveBeenCalledWith({
        ...createHighLevelPasswordData,
        user: { id: userId },
        password: mockedHash,
      });
      expect(mockHighLevelPasswordRepository.save).toHaveBeenCalledWith(
        newHighLevelPassword,
      );
      expect(result).toEqual(newHighLevelPassword);
    });
  });

  describe('verifyHighLevelPassword', () => {
    it('should verify the high level password and return true if the password matches', async () => {
      const userId = 'user-id';
      const highLevelPassword = 'password123';
      const storedHighLevelPassword = {
        user: { id: userId },
        password:
          '$2b$10$zeULTGJGvzaCcKc8WLSfl.9TDbZLfhkcDJZQYpNYX/qqSH3Xsjec.',
      };

      jest.spyOn(bcrypt, 'compareSync').mockReturnValue(true);

      mockHighLevelPasswordRepository.findOne.mockResolvedValue(
        storedHighLevelPassword,
      );

      const result = await service.verifyHighLevelPassword(
        userId,
        highLevelPassword,
      );

      expect(bcrypt.compareSync).toHaveBeenCalledWith(
        highLevelPassword,
        storedHighLevelPassword.password,
      );

      expect(result).toBe(true);
    });

    it('should throw an error if the password is incorrect', async () => {
      const userId = 'user-id';
      const highLevelPassword = 'wrong-password';
      const storedHighLevelPassword = {
        user: { id: userId },
        password:
          '$2b$10$zeULTGJGvzaCcKc8WLSfl.9TDbZLfhkcDJZQYpNYX/qqSH3Xsjec.',
      };

      jest.spyOn(bcrypt, 'compareSync').mockReturnValue(false);

      mockHighLevelPasswordRepository.findOne.mockResolvedValue(
        storedHighLevelPassword,
      );

      await expect(
        service.verifyHighLevelPassword(userId, highLevelPassword),
      ).rejects.toThrow(ErrorCode.INCORRECT_PASSWORD);

      expect(bcrypt.compareSync).toHaveBeenCalledWith(
        highLevelPassword,
        storedHighLevelPassword.password,
      );
    });
  });

  describe('toggleHighPassword', () => {
    it('should toggle the high level password status from disabled to enabled', async () => {
      const userId = 'user-id';
      const existingPassword = {
        user: { id: userId },
        status: StatusTwoFa.DISABLED,
      };

      mockHighLevelPasswordRepository.findOne.mockResolvedValue(
        existingPassword,
      );
      mockHighLevelPasswordRepository.save.mockResolvedValue({
        ...existingPassword,
        status: StatusTwoFa.ENABLED,
      });

      await service.toggleHighPassword(userId);

      expect(mockHighLevelPasswordRepository.findOne).toHaveBeenCalledWith({
        where: { user: { id: userId } },
      });
      expect(mockHighLevelPasswordRepository.save).toHaveBeenCalledWith({
        ...existingPassword,
        status: StatusTwoFa.ENABLED,
      });
    });

    it('should toggle the high level password status from enabled to disabled', async () => {
      const userId = 'user-id';
      const existingPassword = {
        user: { id: userId },
        status: StatusTwoFa.ENABLED,
      };

      mockHighLevelPasswordRepository.findOne.mockResolvedValue(
        existingPassword,
      );
      mockHighLevelPasswordRepository.save.mockResolvedValue({
        ...existingPassword,
        status: StatusTwoFa.DISABLED,
      });

      await service.toggleHighPassword(userId);

      expect(mockHighLevelPasswordRepository.findOne).toHaveBeenCalledWith({
        where: { user: { id: userId } },
      });
      expect(mockHighLevelPasswordRepository.save).toHaveBeenCalledWith({
        ...existingPassword,
        status: StatusTwoFa.DISABLED,
      });
    });

    it('should throw an error if the high level password does not exist', async () => {
      const userId = 'user-id';

      mockHighLevelPasswordRepository.findOne.mockResolvedValue(null);

      await expect(service.toggleHighPassword(userId)).rejects.toThrowError(
        ErrorCode.HIGH_LEVEL_PASSWORD_NOT_FOUND,
      );
    });
  });
});
