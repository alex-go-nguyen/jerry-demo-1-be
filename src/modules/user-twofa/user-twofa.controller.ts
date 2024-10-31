import { Controller, Get, HttpCode } from '@nestjs/common';
import { UserTwoFaService } from './user-twofa.service';
import { ApiOkResponse } from '@nestjs/swagger';

@Controller('two-factor-auth')
export class UserTwoFaController {
  constructor(private readonly twoFactorAuthService: UserTwoFaService) {}

  @Get('generate-qr')
  @HttpCode(200)
  @ApiOkResponse({ description: 'token' })
  async generateQr() {
    try {
      return await this.twoFactorAuthService.generateQr();
    } catch (error) {
      throw error;
    }
  }
}
