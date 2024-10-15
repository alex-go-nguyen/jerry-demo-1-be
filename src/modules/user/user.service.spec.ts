import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from './entities/user.entity';

import { UsersService } from './user.service';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: Repository<User>;

  const mockUserRepository = () => ({
    createQueryBuilder: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useFactory: mockUserRepository,
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
});
