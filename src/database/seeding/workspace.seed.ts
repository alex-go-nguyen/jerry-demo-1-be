import { faker } from '@faker-js/faker';
import { AppDataSource } from 'typeorm.config';

import { User } from '@/modules/user/entities/user.entity';
import { Account } from '@/modules/account/entities/account.entity';
import { Workspace } from '@/modules/workspace/entities/workspace.entity';

export async function seedWorkspaces() {
  const userRepository = AppDataSource.getRepository(User);
  const accountRepository = AppDataSource.getRepository(Account);
  const workspaceRepository = AppDataSource.getRepository(Workspace);

  const users = await userRepository.find();

  for (const user of users) {
    for (let i = 0; i < 10; i++) {
      const accounts = await accountRepository.find({
        where: { owner: { id: user.id } },
        relations: ['owner'],
      });
      const workspace = workspaceRepository.create({
        name: faker.company.name(),
        owner: user,
        accounts: accounts,
      });

      await workspaceRepository.save(workspace);
    }
  }
}
