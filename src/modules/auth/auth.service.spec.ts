import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from '@nestjs-modules/mailer';

import { Repository } from 'typeorm';

import * as bcrypt from 'bcrypt';

import { LRUCache } from 'lru-cache';

import { ErrorCode } from '@/common/enums';

import { User } from '@/modules/user/entities/user.entity';
import { ConfirmEmailDto } from '@/modules/user/dtos/confirm-email.dto';
import { ForgotPasswordDto } from '@/modules/user/dtos/forgot-password.dto';
import { LoginUserDto } from '@/modules/user/dtos/login-user.dto';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let mailerService: MailerService;
  let mockCache: LRUCache<string, string>;
  let configService: ConfigService;
  let jwtService: JwtService;
  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
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
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
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
    mockCache = module.get<LRUCache<string, string>>(LRUCache);
    configService = module.get<ConfigService>(ConfigService);
    jwtService = module.get<JwtService>(JwtService);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerService', () => {
    it('should throw an error if required fields are missing', async () => {
      const userData = { email: '', name: '', password: '' };

      await expect(service.registerService(userData)).rejects.toThrow(
        new Error(ErrorCode.MISSING_INPUT),
      );
    });

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
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.save.mockResolvedValue({
        ...userData,
        id: 1,
        isAuthenticated: false,
      });
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword' as never);

      mockConfigService.get.mockReturnValue('http://example.com');

      await service.registerService(userData);

      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to: userData.email,
        from: 'Anh bao',
        subject: 'Verify email',
        template: 'verification_email',
        context: { url: 'http://example.com/confirm-email/1' },
      });
    });
  });

  describe('confirmEmailService', () => {
    it('should throw an error if confirmData.id is missing', async () => {
      const confirmData: ConfirmEmailDto = { id: undefined };

      await expect(service.confirmEmailService(confirmData)).rejects.toThrow(
        new Error(ErrorCode.MISSING_INPUT),
      );
    });

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
        new Error(ErrorCode.EMAIL_ALREADY_REGISTERED),
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
      } as User;

      (mockUserRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

      jest.spyOn(bcrypt, 'compareSync').mockResolvedValue(true as never);
      const mockGenerateToken = jest
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
        },
      });

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: loginData.email },
      });
      expect(mockGenerateToken).toHaveBeenCalledTimes(2);
      expect(mockGenerateToken).toHaveBeenCalledWith(
        mockUser,
        process.env.ACCESS_TOKEN_EXPIRATION,
      );
      expect(mockGenerateToken).toHaveBeenCalledWith(
        mockUser,
        process.env.REFRESH_TOKEN_EXPIRATION,
      );
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
        from: 'Anh bao',
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

  describe('freshTokenService', () => {
    it('should generate and return access and refresh tokens for an existing user', async () => {
      const email = 'user@example.com';
      const existingUser = { id: 1, email };
      const accessToken = 'accessToken123';
      const refreshToken = 'refreshToken123';

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(existingUser);
      const mockGenerateToken = jest
        .spyOn(service, 'generateToken')
        .mockResolvedValueOnce(accessToken)
        .mockResolvedValueOnce(refreshToken);

      const result = await service.freshTokenService(email);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email },
      });
      expect(mockGenerateToken).toHaveBeenCalledWith(existingUser, '1h');
      expect(mockGenerateToken).toHaveBeenCalledWith(existingUser, '1d');
      expect(result).toEqual({
        accessToken: 'accessToken123',
        refreshToken: 'refreshToken123',
      });
    });

    it('should throw an error if the user does not exist', async () => {
      const email = 'nonexistent@example.com';

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(null);

      await expect(service.freshTokenService(email)).rejects.toThrow(
        ErrorCode.USER_NOT_FOUND,
      );
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email },
      });
    });
  });

  describe('generateToken', () => {
    it('should generate a token with correct payload and expiration', async () => {
      const user: User = {
        id: 'user_id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
      } as User;

      const expiresIn = '1h';
      const expectedToken = 'mockedToken';
      jest.spyOn(mockJwtService, 'signAsync').mockResolvedValue(expectedToken);
      const token = await service.generateToken(user, expiresIn);

      expect(token).toEqual(expectedToken);

      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        { expiresIn },
      );
    });
  });
});
