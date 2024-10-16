import {
  Controller,
  Post,
  Body,
  Res,
  HttpStatus,
  ForbiddenException,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Req,
} from '@nestjs/common';

import { Response } from 'express';

import { ErrorCode } from '@/common/enums';

import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { handleDataResponse } from '@/utils';

import { AuthService } from '@/modules/auth/auth.service';
import { LoginUserDto } from '@/modules/user/dtos/login-user.dto';
import { CreateUserDto } from '@/modules/user/dtos/create-user.dto';
import { ForgotPasswordDto } from '../user/dtos/forgot-password.dto';
import { ConfirmEmailDto } from '@/modules/user/dtos/confirm-email.dto';

import { VerifyOtpDto } from './dtos/verity-otp.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiCreatedResponse({
    description: 'The user has been successfully registered.',
  })
  @ApiConflictResponse({ description: 'Email is already registered!' })
  async register(
    @Body() userData: CreateUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      await this.authService.registerService(userData);
      response
        .status(HttpStatus.OK)
        .json(
          handleDataResponse(
            'Register successfully! Check and confirm your email',
          ),
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
  @ApiOkResponse({
    description: 'Confirm email successfully!!.',
  })
  @ApiBadRequestResponse({ description: 'Missing input!' })
  async confirm(
    @Body() confirmData: ConfirmEmailDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      await this.authService.confirmEmailService(confirmData);
      response
        .status(HttpStatus.OK)
        .json(handleDataResponse('Confirm email successfully!!'));
    } catch (error) {
      if (error.message === ErrorCode.MISSING_INPUT) {
        throw new BadRequestException(ErrorCode.MISSING_INPUT);
      } else {
        throw error;
      }
    }
  }

  @Post('login')
  @ApiOkResponse({
    description: 'Login successfully!!',
  })
  @ApiConflictResponse({ description: 'Email has not been confirmed!' })
  @ApiBadRequestResponse({ description: 'Incorrect password!' })
  async login(
    @Body() userData: LoginUserDto,
    @Res({ passthrough: true }) response: Response,
    @Req() request: Request,
  ) {
    try {
      const resultData = await this.authService.loginService(userData);
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
          sameSite: 'lax',
        })
        .status(HttpStatus.OK)
        .json({
          ...handleDataResponse('Login successfully!'),
          currentUser: { ...resultData.currentUser },
        });
    } catch (error) {
      if (error.message === ErrorCode.EMAIL_NO_AUTHENTICATED) {
        throw new ConflictException(ErrorCode.EMAIL_NO_AUTHENTICATED);
      } else if (error.message === ErrorCode.INCORRECT_PASSWORD) {
        throw new ForbiddenException(ErrorCode.INCORRECT_PASSWORD);
      } else {
        throw error;
      }
    }
  }
  @Post('logout')
  async logout(@Res({ passthrough: true }) response: Response) {
    try {
      response.clearCookie('access_token');
    } catch (error) {
      throw error;
    }
  }

  @Post('forgot-password')
  @ApiOkResponse({ description: 'Please check your email to confirm forget' })
  @ApiNotFoundResponse({ description: 'Email is not registered!' })
  async forgotPassword(
    @Body() forgotPasswordData: ForgotPasswordDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      await this.authService.forgotPasswordService(forgotPasswordData);
      response
        .status(HttpStatus.OK)
        .json(
          handleDataResponse('Please check your email to confirm forget', 'OK'),
        );
    } catch (error) {
      if (error.message === ErrorCode.USER_NOT_FOUND) {
        throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
      } else {
        throw error;
      }
    }
  }

  @Post('verify-otp')
  @ApiOkResponse({ description: 'OTP is verified' })
  @ApiBadRequestResponse({ description: 'OTP is expired or invalid!' })
  async verifyOTP(
    @Body() otpData: VerifyOtpDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      await this.authService.verifyOTPService(otpData);
      response
        .status(HttpStatus.OK)
        .json(handleDataResponse('OTP is verified', 'OK'));
    } catch (error) {
      if (error.message === ErrorCode.OTP_INVALID) {
        throw new BadRequestException(ErrorCode.OTP_INVALID);
      } else {
        throw error;
      }
    }
  }

  @Post('reset-password')
  @ApiConflictResponse({ description: 'Email has not been confirmed!' })
  async resetPassword(
    @Body() userData: LoginUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      await this.authService.resetPasswordService(userData);
      response
        .status(HttpStatus.OK)
        .json(handleDataResponse('Reset password successfully', 'OK'));
    } catch (error) {
      if (error.message === ErrorCode.EMAIL_NO_AUTHENTICATED) {
        throw new ConflictException(ErrorCode.EMAIL_NO_AUTHENTICATED);
      } else {
        throw error;
      }
    }
  }

  @Post('refresh')
  @ApiUnauthorizedResponse({ description: 'Refresh token is invalid' })
  async refreshToken(@Body('refreshToken') refreshToken: string) {
    try {
      const user = await this.authService.verifyTokenService(refreshToken);
      const resultTokens = await this.authService.freshTokenService(
        user.us_email,
      );
      return resultTokens;
    } catch (error) {
      throw error;
    }
  }
}
