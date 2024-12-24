import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from '@nestjs-modules/mailer';

import { User } from '@/modules/user/entities/user.entity';

import { CreateLoginHistoryDto } from './dtos';
import { LoginHistoryService } from './login-history.service';
import { LoginHistory } from './entities/login-history.entity';

describe('LoginHistoryService', () => {
  let service: LoginHistoryService;
  let loginHistoryRepository: jest.Mocked<Repository<LoginHistory>>;
  let mailerService: MailerService;

  const mockLoginHistoryRepository = () => ({
    create: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  });

  const mockMailerService = () => ({
    sendMail: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginHistoryService,
        {
          provide: getRepositoryToken(LoginHistory),
          useFactory: mockLoginHistoryRepository,
        },
        {
          provide: MailerService,
          useFactory: mockMailerService,
        },
      ],
    }).compile();

    service = module.get<LoginHistoryService>(LoginHistoryService);
    loginHistoryRepository = module.get<jest.Mocked<Repository<LoginHistory>>>(
      getRepositoryToken(LoginHistory),
    );
    mailerService = module.get<MailerService>(MailerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a login history and send a warning email if the device is new', async () => {
      const user: User = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      } as User;
      const createLoginHistoryData: CreateLoginHistoryDto = {
        deviceId: 'device123',
        userAgent: 'Mozilla/5.0',
        ipAddress: '192.168.1.1',
        address: '',
        lat: 0,
        lon: 0,
      };

      const newLoginHistory = {
        ...createLoginHistoryData,
        user,
        loginTime: new Date(),
        id: '1',
        deviceId: createLoginHistoryData.deviceId,
        ipAddress: createLoginHistoryData.ipAddress,
        userAgent: createLoginHistoryData.userAgent,
      };

      const userLoginHistory = [
        {
          ...createLoginHistoryData,
          user,
          loginTime: new Date(),
          id: '1',
          deviceId: 'unknown deviceid',
          ipAddress: createLoginHistoryData.ipAddress,
          userAgent: createLoginHistoryData.userAgent,
        },
      ];

      loginHistoryRepository.create.mockReturnValue(newLoginHistory);
      loginHistoryRepository.find.mockResolvedValue(userLoginHistory);
      loginHistoryRepository.save.mockResolvedValue(newLoginHistory);
      await service.create(user, createLoginHistoryData);

      expect(loginHistoryRepository.create).toHaveBeenCalledWith({
        user,
        ...createLoginHistoryData,
        deviceId: createLoginHistoryData.deviceId,
      });
      expect(loginHistoryRepository.find).toHaveBeenCalledWith({
        where: { user: { id: user.id } },
      });
      expect(loginHistoryRepository.save).toHaveBeenCalledWith(newLoginHistory);
      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to: user.email,
        subject: 'Warning email',
        template: 'warning_email',
        context: {
          fullName: user.name,
          loginTime: newLoginHistory.loginTime,
          userAgent: newLoginHistory.userAgent,
          ipAddress: newLoginHistory.ipAddress,
        },
      });
    });

    it('should not send a warning email if the device is already used by the user', async () => {
      const user: User = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      } as User;

      const createLoginHistoryData: CreateLoginHistoryDto = {
        deviceId: 'device123',
        userAgent: 'Mozilla/5.0',
        ipAddress: '192.168.1.1',
        address: '',
        lat: 0,
        lon: 0,
      };

      const newLoginHistory = {
        ...createLoginHistoryData,
        user,
        loginTime: new Date(),
        id: '1',
        deviceId: createLoginHistoryData.deviceId,
        ipAddress: createLoginHistoryData.ipAddress,
        userAgent: createLoginHistoryData.userAgent,
      };
      const userLoginHistory = [
        {
          ...createLoginHistoryData,
          user,
          loginTime: new Date(),
          id: '1',
          deviceId: createLoginHistoryData.deviceId,
          ipAddress: createLoginHistoryData.ipAddress,
          userAgent: createLoginHistoryData.userAgent,
        },
      ];
      loginHistoryRepository.create.mockReturnValue(newLoginHistory);
      loginHistoryRepository.find.mockResolvedValue(userLoginHistory);
      loginHistoryRepository.save.mockResolvedValue(newLoginHistory);

      await service.create(user, createLoginHistoryData);

      expect(mailerService.sendMail).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return login history within the specified date range', async () => {
      const user: User = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      } as User;
      const startDate = '01-01-2024';
      const endDate = '12-31-2024';
      const skip = 0;
      const createLoginHistoryData: CreateLoginHistoryDto = {
        deviceId: 'device123',
        userAgent: 'Mozilla/5.0',
        ipAddress: '192.168.1.1',
        address: '',
        lat: 0,
        lon: 0,
      };
      const loginHistories = [
        {
          ...createLoginHistoryData,
          user,
          loginTime: new Date(),
          id: '1',
          deviceId: 'unknown deviceid',
          ipAddress: createLoginHistoryData.ipAddress,
          userAgent: createLoginHistoryData.userAgent,
        },
      ];

      loginHistoryRepository.find.mockResolvedValue(loginHistories);

      const result = await service.findAll(user, { startDate, endDate, skip });

      expect(loginHistoryRepository.find).toHaveBeenCalledWith({
        where: {
          user: { id: user.id },
          loginTime: expect.any(Object),
        },
        order: {
          loginTime: 'desc',
        },
        skip,
        take: 10,
      });
      expect(result).toEqual(loginHistories);
    });
  });
});
