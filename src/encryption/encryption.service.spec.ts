import * as CryptoJS from 'crypto-js';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { EncryptionService } from './encryption.service';

describe('EncryptionService', () => {
  let service: EncryptionService;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'ENCRYPTION_KEY') return 'test-key';
        if (key === 'ENCRYPTION_IV') return 'test-iv';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EncryptionService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<EncryptionService>(EncryptionService);
  });

  describe('encryptPassword', () => {
    it('should encrypt the password correctly', () => {
      const password = 'test-password';
      const encryptedPassword = service.encryptPassword(password);

      const expectedEncryptedPassword = CryptoJS.AES.encrypt(
        password,
        CryptoJS.enc.Utf8.parse('test-key'),
        {
          iv: CryptoJS.enc.Utf8.parse('test-iv'),
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7,
        },
      ).toString();

      expect(encryptedPassword).toBe(expectedEncryptedPassword);
    });
  });

  describe('decryptPassword', () => {
    it('should decrypt the encrypted password correctly', () => {
      const encryptedPassword = CryptoJS.AES.encrypt(
        'test-password',
        CryptoJS.enc.Utf8.parse('test-key'),
        {
          iv: CryptoJS.enc.Utf8.parse('test-iv'),
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7,
        },
      ).toString();

      const decryptedPassword = service.decryptPassword(encryptedPassword);

      expect(decryptedPassword).toBe('test-password');
    });
  });
});
