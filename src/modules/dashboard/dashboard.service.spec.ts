import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { User } from '@/modules/user/entities/user.entity';
import { Account } from '@/modules/account/entities/account.entity';

import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let userRepository: Partial<Repository<User>>;
  let accountRepository: Partial<Repository<Account>>;

  beforeEach(async () => {
    const mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(),
    };

    userRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    } as Partial<Repository<User>>;

    accountRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    } as Partial<Repository<Account>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: getRepositoryToken(Account),
          useValue: accountRepository,
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  describe('getUserRegistrations', () => {
    it('should return user registration data grouped by month and year', async () => {
      const mockData = [
        { month: 'January', year: '2024', value: '5' },
        { month: 'February', year: '2024', value: '10' },
      ];

      (
        userRepository.createQueryBuilder().getRawMany as jest.Mock
      ).mockResolvedValue(mockData);

      const result = await service.getUserRegistrations();

      expect(result).toEqual({
        years: [2024],
        data: [
          { month: 'January', year: 2024, value: 5 },
          { month: 'February', year: 2024, value: 10 },
        ],
      });
    });

    it('should return an empty data structure when there are no registrations', async () => {
      (
        userRepository.createQueryBuilder().getRawMany as jest.Mock
      ).mockResolvedValue([]);

      const result = await service.getUserRegistrations();

      expect(result).toEqual({
        years: [],
        data: [],
      });
    });
  });

  describe('getAccountsByDomain', () => {
    it('should return aggregated account data by domain', async () => {
      const mockData = [
        { domain: 'gmail.com', value: 15 },
        { domain: 'unknown.com', value: 5 },
        { domain: 'my.edu.vn', value: 7 },
      ];

      (
        accountRepository.createQueryBuilder().getRawMany as jest.Mock
      ).mockResolvedValue(mockData);

      const result = await service.getAccountsByDomain();

      expect(result).toEqual([
        { domain: 'others', value: 5 },
        { domain: 'gmail.com', value: 15 },
        { domain: 'edu.vn', value: 7 },
      ]);
    });

    it('should aggregate to "others" when domains do not match popular domains', async () => {
      const mockData = [
        { domain: 'unknown.com', value: 20 },
        { domain: 'gmail.com', value: 10 },
        { domain: 'others.com', value: 5 },
      ];

      (
        accountRepository.createQueryBuilder().getRawMany as jest.Mock
      ).mockResolvedValue(mockData);

      const result = await service.getAccountsByDomain();

      expect(result).toEqual([
        { domain: 'others', value: 25 },
        { domain: 'gmail.com', value: 10 },
      ]);
    });
  });
});
