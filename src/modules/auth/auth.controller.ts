import {
  Controller,
  Post,
  Body,
  Res,
  HttpStatus,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Req,
  UseGuards,
  Patch,
  ForbiddenException,
  Get,
  HttpCode,
  UnauthorizedException,
  Param,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request, Response } from 'express';

import {
  ILoginResult,
  ILoginResultWith2FA,
  ILoginResultWithTokens,
} from '@/interfaces';
import {
  CreateUserDto,
  LoginUserDto,
  ConfirmEmailDto,
  ChangePasswordDto,
  ForgotPasswordDto,
} from '@/modules/user/dtos';
import { CurrentUser } from '@/decorators';
import { handleDataResponse } from '@/utils';
import { ErrorCode, Role } from '@/common/enums';
import { AuthService } from '@/modules/auth/auth.service';
import { User } from '@/modules/user/entities/user.entity';
import { RedisCacheService } from '@/cache/redis-cache.service';

import { AuthGuard } from './auth.guard';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';
import { VerifyOtpDto, VerifyTotpDto } from './dtos';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly redisCacheService: RedisCacheService,
  ) {}

  @Post('register')
  @HttpCode(201)
  @ApiCreatedResponse({
    description: 'The user has been successfully registered.',
  })
  @ApiConflictResponse({ description: 'Email is already registered!' })
  @ApiBadRequestResponse({ description: 'Missing input!' })
  async register(@Body() userData: CreateUserDto) {
    try {
      await this.authService.registerService(userData);
      return handleDataResponse(
        'Register successfully! Check and confirm your email',
      );
    } catch (error) {
      if (error.message === ErrorCode.EMAIL_ALREADY_REGISTERED) {
        throw new ConflictException(ErrorCode.EMAIL_ALREADY_REGISTERED);
      } else {
        throw error;
      }
    }
  }

  @Post('confirm')
  @HttpCode(200)
  @ApiOkResponse({
    description: 'Confirm email successfully!!.',
  })
  @ApiBadRequestResponse({ description: 'Missing input!' })
  async confirm(@Body() confirmData: ConfirmEmailDto) {
    try {
      await this.authService.confirmEmailService(confirmData);
      return handleDataResponse('Confirm email successfully!!');
    } catch (error) {
      if (error.message === ErrorCode.EMAIL_ALREADY_REGISTERED) {
        throw new BadRequestException(ErrorCode.EMAIL_ALREADY_REGISTERED);
      } else {
        throw error;
      }
    }
  }

  @Post('login')
  @HttpCode(200)
  @ApiOkResponse({
    description: 'Login successfully!!',
  })
  @ApiConflictResponse({ description: 'Email has not been confirmed!' })
  @ApiBadRequestResponse({ description: 'Incorrect password!' })
  @ApiBadRequestResponse({ description: 'Missing input!' })
  async login(
    @Body() userData: LoginUserDto,
    @Res({ passthrough: true }) response: Response,
    @Req() request: Request,
  ) {
    try {
      const resultData = await this.authService.loginService(userData);

      if (this.isLoginResultWith2FA(resultData)) {
        return resultData;
      }

      this.handleResponseAuthData(resultData, request, response);
    } catch (error) {
      if (error.message === ErrorCode.EMAIL_NO_AUTHENTICATED) {
        throw new ConflictException(ErrorCode.EMAIL_NO_AUTHENTICATED);
      } else if (error.message === ErrorCode.INCORRECT_PASSWORD) {
        throw new BadRequestException(ErrorCode.INCORRECT_PASSWORD);
      } else {
        throw error;
      }
    }
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.User)
  @Get('generate-qr')
  @HttpCode(200)
  @ApiOkResponse({ description: 'token' })
  async generateQr(@CurrentUser() user: User) {
    try {
      if (!user) {
        throw new UnauthorizedException(ErrorCode.USER_NOT_FOUND);
      }
      return await this.authService.generateQrByUserId(user.id);
    } catch (error) {
      throw error;
    }
  }

  @Post('verify-token-2fa')
  @HttpCode(200)
  @ApiOkResponse({ description: 'token' })
  async verifyTotp(
    @Body() veriyTotpData: VerifyTotpDto,
    @Res({ passthrough: true }) response: Response,
    @Req() request: Request,
  ) {
    try {
      const resultData = await this.authService.verifyTokenTwoFa(veriyTotpData);
      this.handleResponseAuthData(resultData, request, response);
    } catch (error) {
      if (error.message === ErrorCode.TOTP_INVALID) {
        throw new ConflictException(ErrorCode.TOTP_INVALID);
      } else {
        throw error;
      }
    }
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.User)
  @Patch('enable-twofa')
  @HttpCode(200)
  @ApiOkResponse({ description: 'Enable two fa successfully!' })
  async enableTwoFa(@CurrentUser() user: User) {
    try {
      await this.authService.enableTwoFa(user.id);
      return handleDataResponse('Your account have been enable two fa', 'OK');
    } catch (error) {
      throw error;
    }
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Res({ passthrough: true }) response: Response) {
    try {
      response.clearCookie('access_token', {
        path: '/',
        httpOnly: true,
        sameSite: process.env.NODE_ENV !== 'development' ? 'none' : 'lax',
        secure: process.env.NODE_ENV !== 'development',
      });
    } catch (error) {
      throw error;
    }
  }

  @Post('forgot-password')
  @HttpCode(200)
  @ApiOkResponse({ description: 'Please check your email to confirm forget' })
  @ApiNotFoundResponse({ description: 'Email is not registered!' })
  @ApiBadRequestResponse({ description: 'Missing input!' })
  async forgotPassword(@Body() forgotPasswordData: ForgotPasswordDto) {
    try {
      await this.authService.forgotPasswordService(forgotPasswordData);
      return handleDataResponse(
        'Please check your email to confirm forget',
        'OK',
      );
    } catch (error) {
      if (error.message === ErrorCode.USER_NOT_FOUND) {
        throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
      } else {
        throw error;
      }
    }
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.User)
  @Patch('change-password')
  @HttpCode(200)
  @ApiOkResponse({
    description: 'Change password successfully!!',
  })
  @ApiBadRequestResponse({ description: 'Incorrect current password!' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiConflictResponse({ description: 'Email has not been confirmed!' })
  @ApiBadRequestResponse({ description: 'Missing input!' })
  async changePassword(
    @Body() changePasswordData: ChangePasswordDto,
    @CurrentUser() user: User,
  ) {
    try {
      await this.authService.changePassword(user.id, changePasswordData);
      return handleDataResponse('Change password successfully', 'OK');
    } catch (error) {
      if (error.message === ErrorCode.USER_NOT_FOUND) {
        throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
      } else if (error.message === ErrorCode.EMAIL_NO_AUTHENTICATED) {
        throw new ConflictException(ErrorCode.EMAIL_NO_AUTHENTICATED);
      } else if (error.message === ErrorCode.INCORRECT_PASSWORD) {
        throw new BadRequestException(ErrorCode.INCORRECT_PASSWORD);
      } else if (error.message === ErrorCode.EMAIL_DEACTIVATED) {
        throw new ForbiddenException(ErrorCode.EMAIL_DEACTIVATED);
      } else {
        throw error;
      }
    }
  }

  @Post('verify-otp')
  @HttpCode(200)
  @ApiOkResponse({ description: 'OTP is verified' })
  @ApiBadRequestResponse({ description: 'OTP is expired or invalid!' })
  @ApiBadRequestResponse({ description: 'Missing input!' })
  async verifyOTP(@Body() otpData: VerifyOtpDto) {
    try {
      await this.authService.verifyOTPService(otpData);
      return handleDataResponse('OTP is verified', 'OK');
    } catch (error) {
      if (error.message === ErrorCode.OTP_INVALID) {
        throw new BadRequestException(ErrorCode.OTP_INVALID);
      } else {
        throw error;
      }
    }
  }

  @Post('reset-password')
  @HttpCode(200)
  @ApiConflictResponse({ description: 'Email has not been confirmed!' })
  @ApiBadRequestResponse({ description: 'Missing input!' })
  async resetPassword(@Body() userData: LoginUserDto) {
    try {
      await this.authService.resetPasswordService(userData);
      return handleDataResponse('Reset password successfully', 'OK');
    } catch (error) {
      if (error.message === ErrorCode.EMAIL_NO_AUTHENTICATED) {
        throw new ConflictException(ErrorCode.EMAIL_NO_AUTHENTICATED);
      } else {
        throw error;
      }
    }
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiUnauthorizedResponse({ description: 'Refresh token is invalid' })
  async refreshToken(@Body('refreshToken') refreshToken: string) {
    try {
      const user = await this.authService.verifyTokenService(refreshToken);
      const resultTokens = await this.authService.reFreshTokenService(
        user.email,
      );
      this.redisCacheService.saveAccessToken(user.id, resultTokens.accessToken);
      return resultTokens;
    } catch (error) {
      throw error;
    }
  }
  private isLoginResultWith2FA(
    result: ILoginResult,
  ): result is ILoginResultWith2FA {
    return (result as ILoginResultWith2FA).statusEnableTwoFa !== undefined;
  }
  private async handleResponseAuthData(
    resultData: ILoginResultWithTokens,
    request: Request,
    response: Response,
  ) {
    this.redisCacheService.saveAccessToken(
      resultData.currentUser.id,
      resultData.accessToken,
    );

    const referer = request.headers['origin'];

    if (referer && referer.startsWith('chrome-extension://')) {
      response.status(HttpStatus.OK).json({
        ...handleDataResponse('Login successfully!'),
        ...resultData,
      });
      return;
    }

    response
      .cookie('access_token', resultData.accessToken, {
        path: '/',
        expires: new Date(Date.now() + +process.env.COOKIE_EXPIRE_TIME),
        httpOnly: true,
        sameSite: process.env.NODE_ENV !== 'development' ? 'none' : 'lax',
        secure: process.env.NODE_ENV !== 'development',
      })
      .status(HttpStatus.OK)
      .json({
        ...handleDataResponse('Login successfully!'),
        currentUser: { ...resultData.currentUser },
      });
  }

  @Get('get-token/:userId')
  @HttpCode(200)
  async getTokenByUserId(
    @Param('userId') userId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const accessToken = await this.redisCacheService.getAccessToken(userId);
    if (accessToken) {
      response.cookie('access_token', accessToken, {
        path: '/',
        expires: new Date(Date.now() + +process.env.COOKIE_EXPIRE_TIME),
        httpOnly: true,
        sameSite: process.env.NODE_ENV !== 'development' ? 'none' : 'lax',
        secure: process.env.NODE_ENV !== 'development',
      });
      return { accessToken };
    } else {
      throw new NotFoundException('No token founded');
    }
  }
}
