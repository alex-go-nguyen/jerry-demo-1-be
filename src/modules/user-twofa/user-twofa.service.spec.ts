import { toDataURL } from 'qrcode';
import { Repository } from 'typeorm';
import * as speakeasy from 'speakeasy';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';

import { StatusTwoFa } from '@/common/enums';

import { UserTwoFaService } from './user-twofa.service';
import { UserTwoFa } from './entities/user-two-fa.entity';

jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,xyz'),
}));

jest.mock('speakeasy');

const mockUserTwoFaRepository = () => ({
  update: jest.fn(),
});

describe('UserTwoFaService', () => {
  let service: UserTwoFaService;
  let userTwoFaRepository: Repository<UserTwoFa>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserTwoFaService,
        {
          provide: getRepositoryToken(UserTwoFa),
          useFactory: mockUserTwoFaRepository,
        },
      ],
    }).compile();

    service = module.get<UserTwoFaService>(UserTwoFaService);
    userTwoFaRepository = module.get<Repository<UserTwoFa>>(
      getRepositoryToken(UserTwoFa),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateQr', () => {
    it('should generate a QR code URL and secret', async () => {
      const secret: speakeasy.GeneratedSecret = {
        ascii: 'ASCII_SECRET',
        hex: 'HEX_SECRET',
        base32: 'BASE32_SECRET',
        google_auth_qr: '',
        otpauth_url: 'otpauth://example',
      };

      const qrCodeUrl = 'data:image/png;base64,xyz';

      const generateSecretSpy = jest
        .spyOn(speakeasy, 'generateSecret')
        .mockReturnValue(secret);

      const result = await service.generateQr();

      expect(generateSecretSpy).toHaveBeenCalledWith({ length: 20 });
      expect(toDataURL).toHaveBeenCalledWith(secret.otpauth_url);
      expect(result).toEqual({ secret, qrCodeUrl });
    });
  });

  describe('verifyTotp', () => {
    it('should return true if the TOTP is valid', async () => {
      const verifyTotpData = { token: '123456', secret: 'secret' };
      speakeasy.totp.verify = jest.fn().mockReturnValue(true);

      const result = await service.verifyTotp(verifyTotpData);

      expect(speakeasy.totp.verify).toHaveBeenCalledWith({
        ...verifyTotpData,
        encoding: 'base32',
      });
      expect(result).toBe(true);
    });

    it('should return false if the TOTP is invalid', async () => {
      const verifyTotpData = { token: '123456', secret: 'secret' };
      speakeasy.totp.verify = jest.fn().mockReturnValue(false);

      const result = await service.verifyTotp(verifyTotpData);

      expect(speakeasy.totp.verify).toHaveBeenCalledWith({
        ...verifyTotpData,
        encoding: 'base32',
      });
      expect(result).toBe(false);
    });
  });

  describe('disableTwoFa', () => {
    it('should disable 2FA for a user', async () => {
      const userId = 'user123';
      userTwoFaRepository.update = jest.fn().mockResolvedValue(undefined);

      await service.disableTwoFa(userId);

      expect(userTwoFaRepository.update).toHaveBeenCalledWith(
        { user: { id: userId } },
        { secret: '', status: StatusTwoFa.DISABLED },
      );
    });
  });
});
