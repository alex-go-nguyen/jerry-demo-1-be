import { faker } from '@faker-js/faker';
import { ConfigService } from '@nestjs/config';
import { AppDataSource } from 'typeorm.config';

import { User } from '@/modules/user/entities/user.entity';
import { Account } from '@/modules/account/entities/account.entity';
import { EncryptionService } from '@/encryption/encryption.service';

export async function seedAccounts() {
  const accountRepository = AppDataSource.getRepository(Account);
  const userRepository = AppDataSource.getRepository(User);

  const configService: ConfigService = new ConfigService();
  const encryptionService = new EncryptionService(configService);

  const users = await userRepository.find({
    skip: 1000,
    take: 200,
  });

  const accounts: Account[] = [];
  const domains = [
    'gmail.com',
    'edu.vn',
    'facebook.com',
    'yahoo.com',
    'outlook.com',
  ];

  for (const user of users) {
    for (let i = 0; i < 50; i++) {
      const account = new Account();
      account.owner = user;
      account.domain = domains[Math.floor(Math.random() * domains.length)];
      account.username = faker.internet.userName();

      const rawPassword = faker.internet.password();
      account.password = encryptionService.encryptPassword(rawPassword);

      accounts.push(account);
    }
  }

  await accountRepository.save(accounts);
}
