import * as bcrypt from 'bcrypt';

import { LRUCache } from 'lru-cache';

import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { MailerService } from '@nestjs-modules/mailer';

import { ErrorCode, StatusEnableTwoFa, StatusTwoFa } from '@/common/enums';

import { UserTwoFaService } from '@/modules/user-twofa/user-twofa.service';

import { User } from '@/modules/user/entities/user.entity';
import { UserTwoFa } from '@/modules/user-twofa/entities/user-two-fa.entity';

import {
  CreateUserDto,
  LoginUserDto,
  ConfirmEmailDto,
  ForgotPasswordDto,
  ChangePasswordDto,
} from '@/modules/user/dtos/';

import { VerifyOtpDto, VerifyTotpDto } from './dtos';
import { ILoginResult, ILoginResultWithTokens } from '@/interfaces';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(UserTwoFa)
    private readonly userTwoFaRepository: Repository<UserTwoFa>,

    private readonly userTwoFaService: UserTwoFaService,

    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
    private jwtService: JwtService,
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

    const newUser = this.userRepository.create({
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
    });

    const saveUser = await this.userRepository.save(newUser);

    const userTwoFa = this.userTwoFaRepository.create({
      user: saveUser,
      secret: '',
    });
    await this.userTwoFaRepository.save(userTwoFa);

    const url = `${this.configService.get<string>('WEB_CLIENT_URL')}/confirm-email/${saveUser.id}`;

    await this.mailerService.sendMail({
      to: saveUser.email,
      from: 'Anh bao',
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
      relations: ['userTwoFa'],
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

    const existedUserTwoFa = await this.userTwoFaRepository.findOne({
      where: { user: { id: userId } },
      withDeleted: true,
    });
    existedUserTwoFa.secret = secret.base32;
    await this.userTwoFaRepository.save(existedUserTwoFa);
    return { userId, qrCodeUrl };
  }

  async verifyTotp(
    veriyTotpData: VerifyTotpDto,
  ): Promise<ILoginResultWithTokens> {
    const existedUser = await this.userRepository.findOne({
      where: { id: veriyTotpData.userId },
      relations: ['userTwoFa'],
    });
    const verifiedTotp = await this.userTwoFaService.verifyTotp({
      secret: existedUser.userTwoFa.secret,
      token: veriyTotpData.token,
    });
    if (verifiedTotp) {
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
    existedUserTwoFa.status = StatusTwoFa.ENABLED;
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
      from: 'Anh bao',
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
      secret: this.configService.get<string>('JWT_SECRET'),
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
      this.generateToken(existedUser, '1h'),
      this.generateToken(existedUser, '1d'),
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
      this.generateToken(user, process.env.ACCESS_TOKEN_EXPIRATION),
      this.generateToken(user, process.env.REFRESH_TOKEN_EXPIRATION),
    ]);

    if (
      accessTokenResult.status === 'rejected' ||
      refreshTokenResult.status === 'rejected'
    ) {
      throw new Error('Error generating tokens');
    }
    const { id, name, role, email, avatar, phoneNumber } = user;

    return {
      accessToken: accessTokenResult.value,
      refreshToken: refreshTokenResult.value,
      currentUser: {
        id,
        name,
        role,
        email,
        avatar,
        status: user.userTwoFa.status,
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
  private checkExistedUser(user: User) {
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
    if (!user.userTwoFa.secret) {
      return {
        userId: user.id,
        statusTwoFa: StatusEnableTwoFa.TWO_FA_ENABLED_NO_SECRET,
      };
    } else {
      return {
        userId: user.id,
        statusTwoFa: StatusEnableTwoFa.TWO_FA_ENABLED_WITH_SECRET,
      };
    }
  }
}
