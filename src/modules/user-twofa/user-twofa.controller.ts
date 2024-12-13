import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Controller, Get, HttpCode, Patch, UseGuards } from '@nestjs/common';

import { CurrentUser } from '@/decorators';
import { AuthGuard } from '@/modules/auth/auth.guard';
import { RolesGuard } from '@/modules/auth/roles.guard';
import { User } from '@/modules/user/entities/user.entity';

import { UserTwoFaService } from './user-twofa.service';

@UseGuards(AuthGuard, RolesGuard)
@ApiTags('Two-Factor-Auth')
@Controller('two-factor-auth')
export class UserTwoFaController {
  constructor(private readonly twoFactorAuthService: UserTwoFaService) {}

  @Get('generate-qr')
  @HttpCode(200)
  @ApiOkResponse({ description: 'token' })
  async generateQr() {
    return await this.twoFactorAuthService.generateQr();
  }

  @Patch('disable-twofa')
  @HttpCode(200)
  @ApiOkResponse({ description: 'Disable two fa successfully!' })
  async disableTwoFa(@CurrentUser() user: User) {
    return this.twoFactorAuthService.disableTwoFa(user.id);
  }
}
