import { AppDataSource } from 'typeorm.config';
import { faker } from '@faker-js/faker';

import { User } from '@/modules/user/entities/user.entity';
import { Workspace } from '@/modules/workspace/entities/workspace.entity';
import { WorkspaceSharingInvitation } from '@/modules/sharing-workspace/entities/sharing-workspace.entity';
function getRandomStatus() {
  return Math.random() < 0.5 ? 'PENDING' : 'ACCEPTED';
}

export async function seedWorkspaceInvitations() {
  const userRepository = AppDataSource.getRepository(User);
  const workspaceRepository = AppDataSource.getRepository(Workspace);
  const invitationRepository = AppDataSource.getRepository(
    WorkspaceSharingInvitation,
  );
  const users = await userRepository.find();
  const workspaces = await workspaceRepository.find();

  for (const workspace of workspaces) {
    const randomUsers = users.sort(() => 0.5 - Math.random()).slice(0, 10);

    for (const user of randomUsers) {
      const invitation = invitationRepository.create({
        owner: workspace.owner,
        workspace: workspace,
        email: faker.internet.email(),
        status: getRandomStatus(),
      });

      await invitationRepository.save(invitation);
      if (invitation.status === 'ACCEPTED') {
        const workspace = await workspaceRepository.findOne({
          where: { id: invitation.workspace.id },
          relations: ['members'],
        });

        if (workspace) {
          workspace.members.push(user);
          await workspaceRepository.save(workspace);
        }
      }
    }
  }
}
