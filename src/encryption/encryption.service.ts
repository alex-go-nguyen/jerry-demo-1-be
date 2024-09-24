import { Injectable } from '@nestjs/common';
import * as CryptoJS from 'crypto-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EncryptionService {
  private readonly key: string;
  private readonly iv: string;

  constructor(private configService: ConfigService) {
    this.key = this.configService.get<string>('ENCRYPTION_KEY');
    this.iv = this.configService.get<string>('ENCRYPTION_IV');
  }

  encryptPassword(password: string): string {
    console.log('first', password);
    const encrypted = CryptoJS.AES.encrypt(
      password,
      CryptoJS.enc.Utf8.parse(this.key),
      {
        iv: CryptoJS.enc.Utf8.parse(this.iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      },
    ).toString();
    return encrypted;
  }

  decryptPassword(encryptedPassword: string): string {
    const decrypted = CryptoJS.AES.decrypt(
      encryptedPassword,
      CryptoJS.enc.Utf8.parse(this.key),
      {
        iv: CryptoJS.enc.Utf8.parse(this.iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      },
    );
    return decrypted.toString(CryptoJS.enc.Utf8);
  }
}
