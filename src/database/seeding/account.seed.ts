import { AppDataSource } from 'typeorm.config';
import { faker } from '@faker-js/faker';
import { Account } from '@/modules/account/entities/account.entity';
import { User } from '@/modules/user/entities/user.entity';

export async function seedAccounts() {
  const accountRepository = AppDataSource.getRepository(Account);
  const userRepository = AppDataSource.getRepository(User);

  const users = await userRepository.find();

  const accounts: Account[] = [];
  const domains = [
    'gmail.com',
    'edu.vn',
    'facebook.com',
    'yahoo.com',
    'outlook.com',
  ];

  for (const user of users) {
    for (let i = 0; i < 10; i++) {
      const account = new Account();
      account.user = user;
      account.domain = domains[Math.floor(Math.random() * domains.length)];
      account.username = faker.internet.userName();
      account.password = faker.internet.password();

      accounts.push(account);
    }
  }

  await accountRepository.save(accounts);
}
