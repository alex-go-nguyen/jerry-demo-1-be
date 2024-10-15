import { AppDataSource } from 'typeorm.config';
import { faker } from '@faker-js/faker';
import { Account } from '@/modules/account/entities/account.entity';
import { User } from '@/modules/user/entities/user.entity';
import { Workspace } from '@/modules/workspace/entities/workspace.entity';

function getRandomAccounts(accounts: Account[], count: number): Account[] {
  const shuffled = accounts.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
export async function seedWorkspaces() {
  const userRepository = AppDataSource.getRepository(User);
  const accountRepository = AppDataSource.getRepository(Account);
  const workspaceRepository = AppDataSource.getRepository(Workspace);

  const users = await userRepository.find();

  const accounts = await accountRepository.find();

  for (const user of users) {
    for (let i = 0; i < 10; i++) {
      const workspace = workspaceRepository.create({
        name: faker.company.name(),
        owner: user,
        accounts: getRandomAccounts(accounts, 10),
      });

      await workspaceRepository.save(workspace);
    }
  }
}
