import { Injectable } from '@nestjs/common';

import * as speakeasy from 'speakeasy';
import { toDataURL } from 'qrcode';

import { VerifyTotpDto } from './dtos/verify-totp-dto';

@Injectable()
export class UserTwoFaService {
  constructor() {}
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
}
