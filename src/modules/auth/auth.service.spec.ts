import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { LRUCache } from 'lru-cache';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from '@nestjs-modules/mailer';

import { ILoginResultWithTokens } from '@/interfaces';
import { User } from '@/modules/user/entities/user.entity';
import { RedisCacheService } from '@/cache/redis-cache.service';
import { LoginUserDto } from '@/modules/user/dtos/login-user.dto';
import { ConfirmEmailDto } from '@/modules/user/dtos/confirm-email.dto';
import { ErrorCode, StatusEnableTwoFa, StatusTwoFa } from '@/common/enums';
import { ForgotPasswordDto } from '@/modules/user/dtos/forgot-password.dto';
import { UserTwoFaService } from '@/modules/user-twofa/user-twofa.service';
import { UserTwoFa } from '@/modules/user-twofa/entities/user-two-fa.entity';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let mailerService: MailerService;
  let configService: ConfigService;
  let jwtService: JwtService;
  let mockCache: LRUCache<string, string>;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockUserTwoFaRepository = {
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    findOne: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const mockMailerService = {
    sendMail: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockUserTwoFaService = {
    generateQr: jest.fn(),
    verifyTotp: jest.fn(),
  };

  const mockRedisCacheService = {
    saveSecretTwoFa: jest.fn(),
    getSkipTwoFa: jest.fn(),
    getSecretTwoFa: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(UserTwoFa),
          useValue: mockUserTwoFaRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: MailerService,
          useValue: mockMailerService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: UserTwoFaService,
          useValue: mockUserTwoFaService,
        },
        {
          provide: RedisCacheService,
          useValue: mockRedisCacheService,
        },
        {
          provide: LRUCache,
          useFactory: () => {
            return new LRUCache<string, string>({
              max: 500,
              maxSize: 5000,
              ttl: 1000 * 60 * 5,
              sizeCalculation: () => 1,
            });
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    mailerService = module.get<MailerService>(MailerService);
    configService = module.get<ConfigService>(ConfigService);
    jwtService = module.get<JwtService>(JwtService);
    mockCache = module.get<LRUCache<string, string>>(LRUCache);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerService', () => {
    it('should throw an error if email is already registered', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test',
        password: '123456',
      };
      mockUserRepository.findOne.mockResolvedValue(userData);

      await expect(service.registerService(userData)).rejects.toThrow(
        new Error(ErrorCode.EMAIL_ALREADY_REGISTERED),
      );
    });

    it('should hash the password and send a verification email', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test',
        password: '123456',
      };

      const savedUser = {
        ...userData,
        id: 1,
        isAuthenticated: false,
      };
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(userData);
      mockUserRepository.save.mockResolvedValue(savedUser);

      mockUserTwoFaRepository.create.mockReturnValue({
        user: savedUser,
        secret: '',
      });
      mockUserTwoFaRepository.save.mockResolvedValue(null);

      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword' as never);
      mockConfigService.get.mockReturnValue('http://example.com');

      await service.registerService(userData);

      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10);

      expect(mockUserRepository.create).toHaveBeenCalledWith({
        name: userData.name,
        email: userData.email,
        password: 'hashedPassword',
      });

      expect(mockUserRepository.save).toHaveBeenCalledWith(userData);

      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to: userData.email,
        from: 'http://example.com',
        subject: 'Verify email',
        template: 'verification_email',
        context: { url: 'http://example.com/confirm-email/1' },
      });
    });
  });

  describe('confirmEmailService', () => {
    it('should set isAuthenticated to true and save the user if user exists', async () => {
      const confirmData: ConfirmEmailDto = { id: 'user-id' };
      const user = { id: 'user-id', isAuthenticated: false };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user as User);
      jest.spyOn(userRepository, 'save').mockResolvedValue(user as User);

      await service.confirmEmailService(confirmData);

      expect(user.isAuthenticated).toBe(true);
      expect(userRepository.save).toHaveBeenCalledWith(user);
    });

    it('should throw an error if user does not exist', async () => {
      const confirmData: ConfirmEmailDto = { id: 'user-id' };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.confirmEmailService(confirmData)).rejects.toThrow(
        new Error(ErrorCode.INVALID_LINK_EMAIL_VERIFICATION),
      );
    });
  });

  describe('loginService', () => {
    it('should return tokens and user info if login is successful', async () => {
      const loginData: LoginUserDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const hashedPassword = await bcrypt.hash(loginData.password, 10);

      const mockUser: User = {
        id: 'user_id',
        email: loginData.email,
        name: 'Test User',
        role: 'user',
        password: hashedPassword,
        isAuthenticated: true,
        deletedAt: null,
        userTwoFa: { status: StatusTwoFa.NOT_REGISTERED },
        highLevelPasswords: [],
      } as User;

      (mockUserRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

      jest.spyOn(bcrypt, 'compareSync').mockResolvedValue(true as never);
      jest
        .spyOn(service, 'generateToken')
        .mockResolvedValueOnce('access_token')
        .mockResolvedValueOnce('refresh_token');

      const result = await service.loginService(loginData);

      expect(result).toEqual({
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        currentUser: {
          id: mockUser.id,
          name: mockUser.name,
          role: mockUser.role,
          email: mockUser.email,
          avatar: undefined,
          highLevelPasswords: [],
          status: StatusTwoFa.NOT_REGISTERED,
          isSkippedTwoFa: false,
          phoneNumber: undefined,
        },
      });
    });

    it('should return 2FA status if 2FA is enabled', async () => {
      const loginData: LoginUserDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const hashedPassword = await bcrypt.hash(loginData.password, 10);
      const mockUser: User = {
        id: 'user_id',
        email: loginData.email,
        name: 'Test User',
        role: 'user',
        password: hashedPassword,
        isAuthenticated: true,
        deletedAt: null,
        userTwoFa: { status: StatusTwoFa.ENABLED, secret: 'secret' },
      } as User;

      (mockUserRepository.findOne as jest.Mock).mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compareSync').mockReturnValue(true);

      const result = await service.loginService(loginData);

      expect(result).toEqual({
        userId: mockUser.id,
        statusEnableTwoFa: StatusEnableTwoFa.TWO_FA_ENABLED_WITH_SECRET,
      });
    });

    it('should throw an error if user is not found', async () => {
      const loginData: LoginUserDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      (mockUserRepository.findOne as jest.Mock).mockResolvedValue(undefined);

      await expect(service.loginService(loginData)).rejects.toThrow(
        ErrorCode.USER_NOT_FOUND,
      );
    });

    it('should throw an error if user is not authenticated', async () => {
      const loginData: LoginUserDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser: User = {
        id: 'user_id',
        email: loginData.email,
        name: 'Test User',
        role: 'user',
        password: 'hashedPassword',
        isAuthenticated: false,
      } as User;
      (mockUserRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

      await expect(service.loginService(loginData)).rejects.toThrow(
        ErrorCode.EMAIL_NO_AUTHENTICATED,
      );
    });

    it('should throw an error if password is incorrect', async () => {
      const loginData: LoginUserDto = {
        email: 'test@example.com',
        password: 'wrongPassword',
      };

      const hashedPassword = await bcrypt.hash('password123', 10);

      const mockUser: User = {
        id: 'user_id',
        email: loginData.email,
        name: 'Test User',
        role: 'user',
        password: hashedPassword,
        isAuthenticated: true,
      } as User;

      (mockUserRepository.findOne as jest.Mock).mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compareSync').mockReturnValue(false);

      await expect(service.loginService(loginData)).rejects.toThrow(
        ErrorCode.INCORRECT_PASSWORD,
      );
    });

    it('should throw an error if user is deactivated', async () => {
      const loginData: LoginUserDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser: User = {
        id: 'user_id',
        email: loginData.email,
        name: 'Test User',
        role: 'user',
        password: 'hashedPassword',
        isAuthenticated: true,
        deletedAt: new Date(),
      } as User;

      (mockUserRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

      await expect(service.loginService(loginData)).rejects.toThrow(
        ErrorCode.EMAIL_DEACTIVATED,
      );
    });

    it('should throw an error if token generation fails', async () => {
      const loginData: LoginUserDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const hashedPassword = await bcrypt.hash(loginData.password, 10);

      const mockUser: User = {
        id: 'user_id',
        email: loginData.email,
        name: 'Test User',
        role: 'user',
        password: hashedPassword,
        isAuthenticated: true,
      } as User;

      (mockUserRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

      jest.spyOn(bcrypt, 'compareSync').mockReturnValue(true);
      jest
        .spyOn(service, 'generateToken')
        .mockRejectedValue(new Error('Token error'));

      await expect(service.loginService(loginData)).rejects.toThrow(
        'Error generating tokens',
      );
    });
  });

  describe('generateQr', () => {
    it('should generate a QR code and save the secret in Redis', async () => {
      const mockUserId = 'user_id_123';
      const mockSecret = { base32: 'mockBase32Secret' };
      const mockQrCodeUrl = 'mockQrCodeUrl';

      jest.spyOn(mockUserTwoFaService, 'generateQr').mockResolvedValue({
        secret: mockSecret,
        qrCodeUrl: mockQrCodeUrl,
      });
      jest
        .spyOn(mockRedisCacheService, 'saveSecretTwoFa')
        .mockResolvedValue(undefined);

      const result = await service.generateQrByUserId(mockUserId);

      expect(mockUserTwoFaService.generateQr).toHaveBeenCalledTimes(1);
      expect(mockRedisCacheService.saveSecretTwoFa).toHaveBeenCalledWith(
        mockUserId,
        mockSecret.base32,
      );
      expect(result).toEqual({ qrCodeUrl: mockQrCodeUrl });
    });

    it('should throw an error if generating QR code fails', async () => {
      const mockUserId = 'user_id_123';

      jest
        .spyOn(mockUserTwoFaService, 'generateQr')
        .mockRejectedValue(new Error('QR generation error'));

      await expect(service.generateQrByUserId(mockUserId)).rejects.toThrow(
        'QR generation error',
      );
      expect(mockRedisCacheService.saveSecretTwoFa).not.toHaveBeenCalled();
    });

    it('should throw an error if saving secret to Redis fails', async () => {
      const mockUserId = 'user_id_123';
      const mockSecret = { base32: 'mockBase32Secret' };
      const mockQrCodeUrl = 'mockQrCodeUrl';

      jest.spyOn(mockUserTwoFaService, 'generateQr').mockResolvedValue({
        secret: mockSecret,
        qrCodeUrl: mockQrCodeUrl,
      });
      jest
        .spyOn(mockRedisCacheService, 'saveSecretTwoFa')
        .mockRejectedValue(new Error('Redis save error'));

      await expect(service.generateQrByUserId(mockUserId)).rejects.toThrow(
        'Redis save error',
      );
      expect(mockUserTwoFaService.generateQr).toHaveBeenCalledTimes(1);
    });
  });

  describe('verifyTokenTwoFa', () => {
    it('should verify token and return authentication data if token is valid', async () => {
      const mockUserId = 'user_id_123';
      const mockSecret = 'mockRedisSecret';
      const mockToken = '123456';
      const mockExistedUser = {
        id: mockUserId,
        userTwoFa: { secret: null },
        highLevelPasswords: [],
      } as User;
      const mockAuthData: ILoginResultWithTokens = {
        accessToken: 'mockAccessToken',
        refreshToken: 'mockRefreshToken',
        currentUser: {
          id: mockUserId,
          name: 'Mock User',
          role: 'user',
          email: 'user@example.com',
          avatar: 'avatar_url',
          status: 'active',
          phoneNumber: '1234567890',
          highLevelPasswords: [{ type: 'password', status: 'active' }],
          isSkippedTwoFa: false,
        },
      };

      jest
        .spyOn(mockUserRepository, 'findOne')
        .mockResolvedValue(mockExistedUser);
      jest
        .spyOn(mockRedisCacheService, 'getSecretTwoFa')
        .mockResolvedValue(mockSecret);
      jest.spyOn(mockUserTwoFaService, 'verifyTotp').mockResolvedValue(true);
      jest
        .spyOn(mockUserTwoFaRepository, 'update')
        .mockResolvedValue(undefined);
      jest
        .spyOn(service, 'handleResponseAuthData')
        .mockResolvedValue(mockAuthData);

      const result = await service.verifyTokenTwoFa({
        userId: mockUserId,
        token: mockToken,
      });

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUserId },
        relations: ['userTwoFa', 'highLevelPasswords'],
      });
      expect(mockRedisCacheService.getSecretTwoFa).toHaveBeenCalledWith(
        mockUserId,
      );
      expect(mockUserTwoFaService.verifyTotp).toHaveBeenCalledWith({
        secret: mockSecret,
        token: mockToken,
      });
      expect(mockUserTwoFaRepository.update).toHaveBeenCalledWith(
        { user: { id: mockUserId } },
        { secret: mockSecret, status: 'ENABLED' },
      );
      expect(result).toEqual(mockAuthData);
    });

    it('should throw an error if the token is invalid', async () => {
      const mockUserId = 'user_id_123';
      const mockSecret = 'mockRedisSecret';
      const mockToken = '123456';
      const mockExistedUser = {
        id: mockUserId,
        userTwoFa: { secret: null },
        highLevelPasswords: [],
      };

      jest
        .spyOn(mockUserRepository, 'findOne')
        .mockResolvedValue(mockExistedUser);
      jest
        .spyOn(mockRedisCacheService, 'getSecretTwoFa')
        .mockResolvedValue(mockSecret);
      jest.spyOn(mockUserTwoFaService, 'verifyTotp').mockResolvedValue(false);

      await expect(
        service.verifyTokenTwoFa({ userId: mockUserId, token: mockToken }),
      ).rejects.toThrow('TOTP_INVALID');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUserId },
        relations: ['userTwoFa', 'highLevelPasswords'],
      });
      expect(mockRedisCacheService.getSecretTwoFa).toHaveBeenCalledWith(
        mockUserId,
      );
      expect(mockUserTwoFaService.verifyTotp).toHaveBeenCalledWith({
        secret: mockSecret,
        token: mockToken,
      });
      expect(mockUserTwoFaRepository.update).not.toHaveBeenCalled();
    });

    it('should use the secret from userTwoFa if Redis does not have it', async () => {
      const mockUserId = 'user_id_123';
      const mockSecret = 'mockDbSecret';
      const mockToken = '123456';
      const mockExistedUser = {
        id: mockUserId,
        userTwoFa: { secret: mockSecret },
        highLevelPasswords: [],
      } as User;
      const mockAuthData: ILoginResultWithTokens = {
        accessToken: 'mockAccessToken',
        refreshToken: 'mockRefreshToken',
        currentUser: {
          id: mockUserId,
          name: 'Mock User',
          role: 'user',
          email: 'user@example.com',
          avatar: 'avatar_url',
          status: 'active',
          phoneNumber: '1234567890',
          highLevelPasswords: [{ type: 'password', status: 'active' }],
          isSkippedTwoFa: false,
        },
      };

      jest
        .spyOn(mockUserRepository, 'findOne')
        .mockResolvedValue(mockExistedUser);
      jest
        .spyOn(mockRedisCacheService, 'getSecretTwoFa')
        .mockResolvedValue(null);
      jest.spyOn(mockUserTwoFaService, 'verifyTotp').mockResolvedValue(true);
      jest
        .spyOn(service, 'handleResponseAuthData')
        .mockResolvedValue(mockAuthData);

      const result = await service.verifyTokenTwoFa({
        userId: mockUserId,
        token: mockToken,
      });

      expect(mockRedisCacheService.getSecretTwoFa).toHaveBeenCalledWith(
        mockUserId,
      );
      expect(mockUserTwoFaService.verifyTotp).toHaveBeenCalledWith({
        secret: mockSecret,
        token: mockToken,
      });
      expect(result).toEqual(mockAuthData);
    });
  });

  describe('enableTwoFa', () => {
    it('should enable 2FA for the user when user exists and 2FA is enabled successfully', async () => {
      const userId = 'some-user-id';
      const mockUser = { id: userId, name: 'John Doe' };
      const mockTwoFa = { user: mockUser, someProperty: 'someValue' };

      mockUserTwoFaRepository.findOne.mockResolvedValue(mockTwoFa);
      mockUserTwoFaRepository.save.mockResolvedValue(mockTwoFa);
      service.checkExistedUser = jest.fn().mockReturnValue(true);

      await service.enableTwoFa(userId);

      expect(mockUserTwoFaRepository.findOne).toHaveBeenCalledWith({
        where: { user: { id: userId } },
        relations: ['user'],
      });
      expect(mockUserTwoFaRepository.save).toHaveBeenCalledWith(mockTwoFa);
      expect(service.checkExistedUser).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('forgotPasswordService', () => {
    it('should throw an error if user is not found', async () => {
      const forgotPasswordData: ForgotPasswordDto = {
        email: 'nonexistent@example.com',
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.forgotPasswordService(forgotPasswordData),
      ).rejects.toThrow(new Error(ErrorCode.USER_NOT_FOUND));
    });

    it('should throw an error if user is not authenticated', async () => {
      const forgotPasswordData: ForgotPasswordDto = {
        email: 'user@example.com',
      };
      const user = { email: 'user@example.com', isAuthenticated: false };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user as User);

      await expect(
        service.forgotPasswordService(forgotPasswordData),
      ).rejects.toThrow(new Error(ErrorCode.EMAIL_NO_AUTHENTICATED));
    });

    it('should generate a verification token, cache it, and send a password reset email', async () => {
      const forgotPasswordData: ForgotPasswordDto = {
        email: 'user@example.com',
      };
      const user = { email: 'user@example.com', isAuthenticated: true };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user as User);
      jest.spyOn(mockCache, 'set');
      jest.spyOn(mailerService, 'sendMail').mockResolvedValue(null);

      await service.forgotPasswordService(forgotPasswordData);

      expect(mockCache.set).toHaveBeenCalledWith(
        `otp:${forgotPasswordData.email}`,
        expect.any(String),
      );
      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to: forgotPasswordData.email,
        from: 'http://example.com',
        subject: 'Forgot password',
        template: 'password_reset_request',
        context: { verificationToken: expect.any(String) },
      });
    });
  });

  describe('verifyOTPService', () => {
    it('should verify OTP successfully', async () => {
      const verifyOtpData = {
        email: 'user@example.com',
        otp: '123456',
      };

      jest.spyOn(mockCache, 'get').mockReturnValue('123456');

      await service.verifyOTPService(verifyOtpData);

      expect(mockCache.get).toHaveBeenCalledWith(`otp:${verifyOtpData.email}`);
    });

    it('should throw an error if OTP is not found in cache', async () => {
      const verifyOtpData = {
        email: 'user@example.com',
        otp: '123456',
      };
      jest.spyOn(mockCache, 'get').mockReturnValue(undefined);
      await expect(service.verifyOTPService(verifyOtpData)).rejects.toThrow(
        ErrorCode.OTP_INVALID,
      );

      expect(mockCache.get).toHaveBeenCalledWith(`otp:${verifyOtpData.email}`);
    });

    it('should throw an error if OTP does not match', async () => {
      const verifyOtpData = {
        email: 'user@example.com',
        otp: '123456',
      };
      jest.spyOn(mockCache, 'get').mockReturnValue('654321');
      await expect(service.verifyOTPService(verifyOtpData)).rejects.toThrow(
        ErrorCode.OTP_INVALID,
      );

      expect(mockCache.get).toHaveBeenCalledWith(`otp:${verifyOtpData.email}`);
    });
  });

  describe('resetPasswordService', () => {
    it('should reset the password successfully', async () => {
      const userData = {
        email: 'user@example.com',
        password: 'newPassword123',
      };
      const existedUser = {
        email: userData.email,
        password: 'oldHashedPassword',
        isAuthenticated: true,
      };

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(existedUser);
      jest.spyOn(mockCache, 'get').mockReturnValue('123456');
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword' as never);
      const cacheDeleteSpy = jest.spyOn(mockCache, 'delete');
      const userSaveSpy = jest
        .spyOn(mockUserRepository, 'save')
        .mockResolvedValue(existedUser);

      await service.resetPasswordService(userData);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: userData.email },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
      expect(existedUser.password).toBe('hashedPassword');
      expect(userSaveSpy).toHaveBeenCalledWith(existedUser);
      expect(cacheDeleteSpy).toHaveBeenCalledWith(`otp:${userData.email}`);
    });

    it('should throw an error if the user is not found', async () => {
      const userData = {
        email: 'user@example.com',
        password: 'newPassword123',
      };
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(undefined);
      await expect(service.resetPasswordService(userData)).rejects.toThrow(
        ErrorCode.USER_NOT_FOUND,
      );

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: userData.email },
      });
    });

    it('should throw an error if the user is not authenticated', async () => {
      const userData = {
        email: 'user@example.com',
        password: 'newPassword123',
      };
      const existedUser = {
        email: userData.email,
        password: 'hashed password',
        isAuthenticated: false,
      };

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(existedUser);

      await expect(service.resetPasswordService(userData)).rejects.toThrow(
        ErrorCode.EMAIL_NO_AUTHENTICATED,
      );

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: userData.email },
      });
    });

    it('should throw an error if OTP is not found in cache', async () => {
      const userData = {
        email: 'user@example.com',
        password: 'newPassword123',
      };
      const existedUser = {
        email: userData.email,
        password: 'hashed password',
        isAuthenticated: true,
      };

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(existedUser);
      jest.spyOn(mockCache, 'get').mockReturnValue(undefined);

      await expect(service.resetPasswordService(userData)).rejects.toThrow(
        ErrorCode.OTP_INVALID,
      );

      expect(mockCache.get).toHaveBeenCalledWith(`otp:${userData.email}`);
    });
  });

  describe('verifyTokenService', () => {
    it('should verify the token successfully', async () => {
      const token = 'validToken';
      const decodedToken = { id: 1, email: 'user@example.com' };
      jest.spyOn(configService, 'get').mockReturnValue('jwtSecret');
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(decodedToken);

      const result = await service.verifyTokenService(token);

      expect(configService.get).toHaveBeenCalledWith('JWT_SECRET');
      expect(jwtService.verifyAsync).toHaveBeenCalledWith(token, {
        secret: 'jwtSecret',
      });
      expect(result).toEqual(decodedToken);
    });

    it('should throw an error if the token is invalid', async () => {
      const token = 'invalidToken';
      const error = new Error('Invalid token');

      jest.spyOn(configService, 'get').mockReturnValue('jwtSecret');
      jest.spyOn(jwtService, 'verifyAsync').mockRejectedValue(error);

      await expect(service.verifyTokenService(token)).rejects.toThrow(
        'Invalid token',
      );

      expect(configService.get).toHaveBeenCalledWith('JWT_SECRET');
      expect(jwtService.verifyAsync).toHaveBeenCalledWith(token, {
        secret: 'jwtSecret',
      });
    });
  });

  describe('reFreshTokenService', () => {
    it('should generate and return access and refresh tokens for an existing user', async () => {
      const email = 'user@example.com';
      const existingUser = { id: 1, email };
      const accessToken = 'accessToken123';
      const refreshToken = 'refreshToken123';
      const jwtSecret = 'jwtSecret';

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(existingUser);

      const mockGenerateToken = jest
        .spyOn(service, 'generateToken')
        .mockResolvedValueOnce(accessToken)
        .mockResolvedValueOnce(refreshToken);

      jest.spyOn(configService, 'get').mockReturnValue(jwtSecret);

      const result = await service.reFreshTokenService(email);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email },
      });

      expect(mockGenerateToken).toHaveBeenCalledWith(existingUser, jwtSecret);
      expect(mockGenerateToken).toHaveBeenCalledWith(existingUser, jwtSecret);

      expect(result).toEqual({
        accessToken: 'accessToken123',
        refreshToken: 'refreshToken123',
      });
    });

    it('should throw an error if the user does not exist', async () => {
      const email = 'nonexistent@example.com';

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(null);

      await expect(service.reFreshTokenService(email)).rejects.toThrow(
        ErrorCode.USER_NOT_FOUND,
      );

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email },
      });
    });

    it('should throw an error if token generation fails', async () => {
      const email = 'user@example.com';
      const existingUser = { id: 1, email };

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(existingUser);

      const mockGenerateToken = jest
        .spyOn(service, 'generateToken')
        .mockRejectedValueOnce(new Error('Error generating tokens'));

      await expect(service.reFreshTokenService(email)).rejects.toThrow(
        'Error generating tokens',
      );

      expect(mockGenerateToken).toHaveBeenCalledTimes(2);
    });
  });

  describe('generateToken', () => {
    it('should generate a token with correct payload and expiration', async () => {
      const user: User = {
        id: 'user_id',
        email: 'test@example.com',
        role: 'user',
      } as User;

      const expiresIn = '1h';
      const expectedToken = 'mockedToken';
      jest.spyOn(mockJwtService, 'signAsync').mockResolvedValue(expectedToken);
      const token = await service.generateToken(user, expiresIn);

      expect(token).toEqual(expectedToken);

      expect(mockJwtService.signAsync).toHaveBeenCalledWith(user, {
        expiresIn,
      });
    });
  });
});
