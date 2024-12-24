import { faker } from '@faker-js/faker';
import { AppDataSource } from 'typeorm.config';

import { User } from '@/modules/user/entities/user.entity';
import { Workspace } from '@/modules/workspace/entities/workspace.entity';

export async function seedWorkspaces() {
  const userRepository = AppDataSource.getRepository(User);
  const workspaceRepository = AppDataSource.getRepository(Workspace);

  const users = await userRepository.find({
    skip: 800,
    take: 200,
  });

  const workspaces: Workspace[] = [];

  for (const user of users) {
    for (let i = 0; i < 50; i++) {
      const workspace = workspaceRepository.create({
        name: faker.company.name(),
        owner: user,
        accounts: [],
      });
      workspaces.push(workspace);
    }
  }
  await workspaceRepository.save(workspaces);
}
