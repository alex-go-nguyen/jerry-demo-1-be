import { toDataURL } from 'qrcode';
import { Repository } from 'typeorm';
import * as speakeasy from 'speakeasy';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { StatusTwoFa } from '@/common/enums';

import { VerifyTotpDto } from './dtos/verify-totp-dto';
import { UserTwoFa } from './entities/user-two-fa.entity';

@Injectable()
export class UserTwoFaService {
  constructor(
    @InjectRepository(UserTwoFa)
    private readonly userTwoFaRepository: Repository<UserTwoFa>,
  ) {}
  async generateQr() {
    const SECRET_LENGTH = 20;
    const secret = speakeasy.generateSecret({ length: SECRET_LENGTH });
    if (!secret.otpauth_url) {
      throw new Error('Failed to generate OTP Auth URL.');
    }

    const qrCodeUrl = await toDataURL(secret.otpauth_url);
    return { secret, qrCodeUrl };
  }

  async verifyTotp(verifyTotpData: VerifyTotpDto) {
    return speakeasy.totp.verify({
      ...verifyTotpData,
      encoding: 'base32',
    });
  }

  async disableTwoFa(userId: string) {
    return await this.userTwoFaRepository.update(
      { user: { id: userId } },
      { secret: '', status: StatusTwoFa.DISABLED },
    );
  }
}
