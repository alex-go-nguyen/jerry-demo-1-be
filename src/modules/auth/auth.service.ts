import * as bcrypt from 'bcryptjs';
import { LRUCache } from 'lru-cache';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { MailerService } from '@nestjs-modules/mailer';

import {
  CreateUserDto,
  LoginUserDto,
  ConfirmEmailDto,
  ForgotPasswordDto,
  ChangePasswordDto,
} from '@/modules/user/dtos';
import { envKeys } from '@/utils/constants';
import { User } from '@/modules/user/entities/user.entity';
import { RedisCacheService } from '@/cache/redis-cache.service';
import { ILoginResult, ILoginResultWithTokens } from '@/interfaces';
import {
  ErrorCode,
  StatusEnableTwoFa,
  StatusTwoFa,
  SubscriptionPlanNames,
} from '@/common/enums';
import { UserTwoFaService } from '@/modules/user-twofa/user-twofa.service';
import { UserTwoFa } from '@/modules/user-twofa/entities/user-two-fa.entity';

import { VerifyOtpDto, VerifyTotpDto } from './dtos';
import { SubscriptionPlan } from '@/modules/subscriptions/entities/subscription-plan.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(UserTwoFa)
    private readonly userTwoFaRepository: Repository<UserTwoFa>,

    @InjectRepository(SubscriptionPlan)
    private readonly subscriptionPlanRepository: Repository<SubscriptionPlan>,

    private readonly userTwoFaService: UserTwoFaService,

    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly redisCacheService: RedisCacheService,

    private readonly cache: LRUCache<string, string>,
  ) {}

  async registerService(userData: CreateUserDto) {
    const existedUser = await this.userRepository.findOne({
      where: { email: userData.email },
      withDeleted: true,
    });

    if (existedUser) {
      throw new Error(ErrorCode.EMAIL_ALREADY_REGISTERED);
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    let freePlan: SubscriptionPlan;

    try {
      freePlan = await this.subscriptionPlanRepository.findOne({
        where: { name: SubscriptionPlanNames.FREE },
      });
    } catch (error) {}

    const newUser = this.userRepository.create({
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      subscription: freePlan,
    });

    const saveUser = await this.userRepository.save(newUser);

    const userTwoFa = this.userTwoFaRepository.create({
      user: saveUser,
      secret: '',
    });
    await this.userTwoFaRepository.save(userTwoFa);

    const url = `${this.configService.get<string>(envKeys.WEB_CLIENT_URL)}/confirm-email/${saveUser.id}`;

    await this.mailerService.sendMail({
      to: saveUser.email,
      from: this.configService.get<string>(envKeys.EMAIL_SENDER),
      subject: 'Verify email',
      template: 'verification_email',
      context: {
        url: url,
      },
    });
  }

  async confirmEmailService(confirmData: ConfirmEmailDto) {
    const existedUser = await this.userRepository.findOne({
      where: { id: confirmData.id },
    });
    if (existedUser && !existedUser.isAuthenticated) {
      existedUser.isAuthenticated = true;
      await this.userRepository.save(existedUser);
    } else {
      throw new Error(ErrorCode.INVALID_LINK_EMAIL_VERIFICATION);
    }
  }

  async loginService(userData: LoginUserDto): Promise<ILoginResult> {
    const existedUser = await this.userRepository.findOne({
      where: { email: userData.email },
      withDeleted: true,
      relations: ['userTwoFa', 'highLevelPasswords'],
    });

    if (!existedUser) {
      throw new Error(ErrorCode.USER_NOT_FOUND);
    } else {
      this.checkUserAuthentication(existedUser);
      this.checkUserActivation(existedUser);
      this.checkPassword(userData.password, existedUser.password);

      return existedUser.userTwoFa?.status === StatusTwoFa.ENABLED
        ? this.handleTwoFaStatus(existedUser)
        : this.handleResponseAuthData(existedUser);
    }
  }

  async generateQrByUserId(userId: string) {
    const { secret, qrCodeUrl } = await this.userTwoFaService.generateQr();
    await this.redisCacheService.saveSecretTwoFa(userId, secret.base32);
    return { qrCodeUrl };
  }

  async verifyTokenTwoFa(
    veriyTotpData: VerifyTotpDto,
  ): Promise<ILoginResultWithTokens> {
    const existedUser = await this.userRepository.findOne({
      where: { id: veriyTotpData.userId },
      relations: ['userTwoFa', 'highLevelPasswords'],
    });
    const existedSecretTwoFa = existedUser.userTwoFa.secret;
    const secret =
      (await this.redisCacheService.getSecretTwoFa(veriyTotpData.userId)) ||
      existedSecretTwoFa;

    const verifiedTotp = await this.userTwoFaService.verifyTotp({
      secret,
      token: veriyTotpData.token,
    });

    if (verifiedTotp) {
      if (!existedSecretTwoFa) {
        await this.userTwoFaRepository.update(
          { user: { id: existedUser.id } },
          {
            secret: secret,
            status: StatusTwoFa.ENABLED,
          },
        );
      }

      return this.handleResponseAuthData(existedUser);
    } else {
      throw new Error(ErrorCode.TOTP_INVALID);
    }
  }

  async enableTwoFa(userId: string) {
    const existedUserTwoFa = await this.userTwoFaRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
    this.checkExistedUser(existedUserTwoFa.user);
    await this.userTwoFaRepository.save(existedUserTwoFa);
  }

  async forgotPasswordService(forgotPasswordData: ForgotPasswordDto) {
    const existedUser = await this.userRepository.findOne({
      where: { email: forgotPasswordData.email },
    });

    if (!existedUser) {
      throw new Error(ErrorCode.USER_NOT_FOUND);
    }

    if (!existedUser.isAuthenticated) {
      throw new Error(ErrorCode.EMAIL_NO_AUTHENTICATED);
    }
    const verificationToken = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();

    this.cache.set(`otp:${forgotPasswordData.email}`, verificationToken);

    await this.mailerService.sendMail({
      to: forgotPasswordData.email,
      from: this.configService.get<string>(envKeys.EMAIL_SENDER),
      subject: 'Forgot password',
      template: 'password_reset_request',
      context: {
        verificationToken,
      },
    });
  }

  async verifyOTPService(verifyOtpData: VerifyOtpDto) {
    const storedOTP = this.cache.get(`otp:${verifyOtpData.email}`);
    if (!storedOTP || storedOTP !== verifyOtpData.otp) {
      throw new Error(ErrorCode.OTP_INVALID);
    }
  }

  async resetPasswordService(userData: LoginUserDto) {
    const existedUser = await this.userRepository.findOne({
      where: { email: userData.email },
    });

    if (!existedUser) {
      throw new Error(ErrorCode.USER_NOT_FOUND);
    }

    if (!existedUser.isAuthenticated) {
      throw new Error(ErrorCode.EMAIL_NO_AUTHENTICATED);
    }
    const storedOTP = this.cache.get(`otp:${userData.email}`);

    if (!storedOTP) {
      throw new Error(ErrorCode.OTP_INVALID);
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    existedUser.password = hashedPassword;

    this.cache.delete(`otp:${userData.email}`);
    return await this.userRepository.save(existedUser);
  }

  async changePassword(userId: string, changePasswordData: ChangePasswordDto) {
    const existedUser = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!existedUser) {
      throw new Error(ErrorCode.USER_NOT_FOUND);
    } else {
      if (!existedUser.isAuthenticated) {
        throw new Error(ErrorCode.EMAIL_NO_AUTHENTICATED);
      }
      const isCorrectPassword = bcrypt.compareSync(
        changePasswordData.currentPassword,
        existedUser.password,
      );
      if (!isCorrectPassword) {
        throw new Error(ErrorCode.INCORRECT_PASSWORD);
      }
      const hashedNewPassword = await bcrypt.hash(
        changePasswordData.newPassword,
        10,
      );
      existedUser.password = hashedNewPassword;
      await this.userRepository.save(existedUser);
    }
  }

  async verifyTokenService(token: string) {
    return await this.jwtService.verifyAsync(token, {
      secret: this.configService.get<string>(envKeys.JWT_SECRET),
    });
  }

  async reFreshTokenService(email: string) {
    const existedUser = await this.userRepository.findOne({
      where: { email },
    });
    if (!existedUser) {
      throw new Error(ErrorCode.USER_NOT_FOUND);
    }

    const [accessTokenResult, refreshTokenResult] = await Promise.allSettled([
      this.generateToken(
        existedUser,
        this.configService.get<string>(envKeys.ACCESS_TOKEN_EXPIRATION),
      ),
      this.generateToken(
        existedUser,
        this.configService.get<string>(envKeys.REFRESH_TOKEN_EXPIRATION),
      ),
    ]);

    if (
      accessTokenResult.status === 'rejected' ||
      refreshTokenResult.status === 'rejected'
    ) {
      throw new Error('Error generating tokens');
    }

    return {
      accessToken: accessTokenResult.value,
      refreshToken: refreshTokenResult.value,
    };
  }
  async handleResponseAuthData(user: User): Promise<ILoginResultWithTokens> {
    const [accessTokenResult, refreshTokenResult] = await Promise.allSettled([
      this.generateToken(
        user,
        this.configService.get<string>(envKeys.ACCESS_TOKEN_EXPIRATION),
      ),
      this.generateToken(
        user,
        this.configService.get<string>(envKeys.REFRESH_TOKEN_EXPIRATION),
      ),
    ]);

    if (
      accessTokenResult.status === 'rejected' ||
      refreshTokenResult.status === 'rejected'
    ) {
      throw new Error('Error generating tokens');
    }
    const {
      id,
      name,
      role,
      email,
      avatar,
      phoneNumber,
      highLevelPasswords,
      userTwoFa: { status },
    } = user;
    const isSkippedTwoFa =
      status === StatusTwoFa.NOT_REGISTERED
        ? !!(await this.redisCacheService.getSkipTwoFa(id))
        : false;
    return {
      accessToken: accessTokenResult.value,
      refreshToken: refreshTokenResult.value,
      currentUser: {
        id,
        name,
        role,
        email,
        avatar,
        highLevelPasswords: highLevelPasswords.map((highLevelPassword) => ({
          methodSecureId: highLevelPassword.id,
          type: highLevelPassword.type,
          status: highLevelPassword.status,
        })),
        status: status,
        isSkippedTwoFa,
        phoneNumber,
      },
    };
  }
  async generateToken(user: User, expiresIn: string | number): Promise<string> {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.signAsync(payload, {
      expiresIn,
    });
  }
  checkExistedUser(user: User) {
    if (!user) {
      throw new Error(ErrorCode.USER_NOT_FOUND);
    }
  }
  private checkUserAuthentication(user: User) {
    if (!user.isAuthenticated) {
      throw new Error(ErrorCode.EMAIL_NO_AUTHENTICATED);
    }
  }

  private checkUserActivation(user: User) {
    if (user.deletedAt) {
      throw new Error(ErrorCode.EMAIL_DEACTIVATED);
    }
  }

  private checkPassword(inputPassword: string, storedPassword: string) {
    const isCorrectPassword = bcrypt.compareSync(inputPassword, storedPassword);
    if (!isCorrectPassword) {
      throw new Error(ErrorCode.INCORRECT_PASSWORD);
    }
  }

  private handleTwoFaStatus(user: User) {
    return {
      userId: user.id,
      statusEnableTwoFa: user.userTwoFa.secret
        ? StatusEnableTwoFa.TWO_FA_ENABLED_WITH_SECRET
        : StatusEnableTwoFa.TWO_FA_ENABLED_NO_SECRET,
    };
  }
}
