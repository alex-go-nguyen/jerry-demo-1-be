import { Repository } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { ErrorCode, StatusTwoFa } from '@/common/enums';
import { RedisCacheService } from '@/cache/redis-cache.service';

import { UpdateUserDto } from './dtos';
import { UsersService } from './user.service';
import { User } from './entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: Repository<User>;

  const mockUserRepository = () => ({
    createQueryBuilder: jest.fn().mockReturnThis(),
    withDeleted: jest.fn().mockReturnThis(),
  });

  const mockRedisCacheService = {
    saveSecretTwoFa: jest.fn(),
    getSkipTwoFa: jest.fn(),
    getSecretTwoFa: jest.fn(),
    saveSkipTwoFa: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useFactory: mockUserRepository,
        },
        {
          provide: RedisCacheService,
          useValue: mockRedisCacheService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUsers', () => {
    it('should return a paginated list of users', async () => {
      const page = 1;
      const limit = 10;
      const mockUsers = [
        {
          id: 1,
          name: 'John Doe',
          email: 'john.doe@example.com',
          isAuthenticated: true,
          accountsCount: 2,
        },
      ];

      const totalCount = 1;

      userRepository.createQueryBuilder = jest.fn().mockReturnThis();
      userRepository.createQueryBuilder('user').leftJoin = jest
        .fn()
        .mockReturnThis();
      userRepository.createQueryBuilder('user').select = jest
        .fn()
        .mockReturnThis();
      userRepository.createQueryBuilder('user').where = jest
        .fn()
        .mockReturnThis();
      userRepository.createQueryBuilder('user').groupBy = jest
        .fn()
        .mockReturnThis();
      userRepository.createQueryBuilder('user').orderBy = jest
        .fn()
        .mockReturnThis();
      userRepository.createQueryBuilder('user').offset = jest
        .fn()
        .mockReturnThis();
      userRepository.createQueryBuilder('user').limit = jest
        .fn()
        .mockReturnThis();
      userRepository.createQueryBuilder('user').getRawMany = jest
        .fn()
        .mockResolvedValue(mockUsers);

      userRepository.createQueryBuilder = jest.fn().mockReturnThis();
      userRepository.createQueryBuilder('user').where = jest
        .fn()
        .mockReturnThis();
      userRepository.createQueryBuilder('user').getCount = jest
        .fn()
        .mockResolvedValue(totalCount);

      const result = await service.getUsers(page, limit);

      expect(result).toEqual({
        listUsers: mockUsers,
        totalItems: totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
      });
      expect(userRepository.createQueryBuilder).toHaveBeenCalledTimes(4);
    });

    it('should handle empty user list', async () => {
      const page = 1;
      const limit = 10;
      const mockUsers: any[] = [];
      const totalCount = 0;

      userRepository.createQueryBuilder = jest.fn().mockReturnThis();
      userRepository.createQueryBuilder('user').leftJoin = jest
        .fn()
        .mockReturnThis();
      userRepository.createQueryBuilder('user').select = jest
        .fn()
        .mockReturnThis();
      userRepository.createQueryBuilder('user').where = jest
        .fn()
        .mockReturnThis();
      userRepository.createQueryBuilder('user').groupBy = jest
        .fn()
        .mockReturnThis();
      userRepository.createQueryBuilder('user').orderBy = jest
        .fn()
        .mockReturnThis();
      userRepository.createQueryBuilder('user').offset = jest
        .fn()
        .mockReturnThis();
      userRepository.createQueryBuilder('user').limit = jest
        .fn()
        .mockReturnThis();
      userRepository.createQueryBuilder('user').getRawMany = jest
        .fn()
        .mockResolvedValue(mockUsers);

      userRepository.createQueryBuilder = jest.fn().mockReturnThis();
      userRepository.createQueryBuilder('user').where = jest
        .fn()
        .mockReturnThis();
      userRepository.createQueryBuilder('user').getCount = jest
        .fn()
        .mockResolvedValue(totalCount);

      const result = await service.getUsers(page, limit);

      expect(result).toEqual({
        listUsers: mockUsers,
        totalItems: totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
      });
    });
  });

  describe('updateProfile', () => {
    it('should throw an error if the user is not found', async () => {
      const profileData: UpdateUserDto = {
        email: 'user@example.com',
        name: 'New Name',
        avatar: 'new-avatar.jpg',
        phoneNumber: '123456789',
      };

      userRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.updateProfile(profileData)).rejects.toThrow(
        ErrorCode.USER_NOT_FOUND,
      );
    });

    it('should throw an error if the user is not authenticated', async () => {
      const profileData: UpdateUserDto = {
        email: 'user@example.com',
        name: 'New Name',
        avatar: 'new-avatar.jpg',
        phoneNumber: '123456789',
      };

      const mockUser = { email: 'user@example.com', isAuthenticated: false };

      userRepository.findOne = jest.fn().mockResolvedValue(mockUser);

      await expect(service.updateProfile(profileData)).rejects.toThrow(
        ErrorCode.EMAIL_NO_AUTHENTICATED,
      );
    });

    it('should update the user profile and return the updated user details', async () => {
      const profileData: UpdateUserDto = {
        email: 'user@example.com',
        name: 'Updated Name',
        avatar: 'updated-avatar.jpg',
        phoneNumber: '987654321',
      };

      const mockUser = {
        id: 1,
        email: 'user@example.com',
        name: 'Old Name',
        avatar: 'old-avatar.jpg',
        phoneNumber: '123456789',
        isAuthenticated: true,
        save: jest.fn(),
      };

      userRepository.findOne = jest.fn().mockResolvedValue(mockUser);
      userRepository.save = jest
        .fn()
        .mockResolvedValue({ ...mockUser, ...profileData });

      const result = await service.updateProfile(profileData);

      expect(result).toEqual({
        id: 1,
        name: 'Updated Name',
        email: 'user@example.com',
        avatar: 'updated-avatar.jpg',
        phoneNumber: '987654321',
      });
      expect(userRepository.save).toHaveBeenCalledWith({
        ...mockUser,
        ...profileData,
      });
    });
  });

  describe('findById', () => {
    it('should return the correct user data with skipped 2FA status', async () => {
      const userId = '12345';
      const mockUser = {
        id: userId,
        name: 'John Doe',
        role: 'user',
        email: 'johndoe@example.com',
        avatar: 'avatar.jpg',
        phoneNumber: '123456789',
        highLevelPasswords: [
          { id: '1', type: 'password', status: 'active' },
          { id: '2', type: 'otp', status: 'inactive' },
        ],
        userTwoFa: { status: StatusTwoFa.NOT_REGISTERED },
      };

      userRepository.findOne = jest.fn().mockResolvedValue(mockUser);
      mockRedisCacheService.getSkipTwoFa = jest.fn().mockResolvedValue(true);

      const result = await service.findById(userId);

      expect(result).toEqual({
        id: userId,
        name: 'John Doe',
        role: 'user',
        email: 'johndoe@example.com',
        avatar: 'avatar.jpg',
        status: StatusTwoFa.NOT_REGISTERED,
        phoneNumber: '123456789',
        highLevelPasswords: [
          { methodSecureId: '1', type: 'password', status: 'active' },
          { methodSecureId: '2', type: 'otp', status: 'inactive' },
        ],
        isSkippedTwoFa: true,
      });
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
        relations: ['userTwoFa', 'highLevelPasswords'],
      });
      expect(mockRedisCacheService.getSkipTwoFa).toHaveBeenCalledWith(userId);
    });
  });

  describe('deactivateUser', () => {
    it('should throw an error if user is not found', async () => {
      const userId = '12345';
      userRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.deactivateUser(userId)).rejects.toThrow(
        ErrorCode.USER_NOT_FOUND,
      );
    });

    it('should deactivate (soft remove) the user and return deletedAt', async () => {
      const userId = '12345';
      const mockUser = { id: userId, deletedAt: new Date() };

      userRepository.findOne = jest.fn().mockResolvedValue(mockUser);
      userRepository.softRemove = jest.fn().mockResolvedValue(mockUser);

      const result = await service.deactivateUser(userId);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(userRepository.softRemove).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUser.deletedAt);
    });
  });

  describe('activeUser', () => {
    it('should restore (activate) the user', async () => {
      const userId = '12345';

      userRepository.restore = jest.fn().mockResolvedValue(undefined);

      await service.activeUser(userId);

      expect(userRepository.restore).toHaveBeenCalledWith({ id: userId });
    });
  });

  describe('skipTwoFa', () => {
    it('should save skipTwoFa status to Redis cache', async () => {
      const userId = '12345';

      mockRedisCacheService.saveSkipTwoFa = jest
        .fn()
        .mockResolvedValue(undefined);

      await service.skipTwoFa(userId);

      expect(mockRedisCacheService.saveSkipTwoFa).toHaveBeenCalledWith(userId);
    });
  });
});
