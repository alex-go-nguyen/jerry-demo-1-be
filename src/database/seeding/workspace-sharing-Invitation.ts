import { faker } from '@faker-js/faker';
import { AppDataSource } from 'typeorm.config';

import { StatusInvitation } from '@/common/enums';
import { User } from '@/modules/user/entities/user.entity';
import { Workspace } from '@/modules/workspace/entities/workspace.entity';
import { WorkspacesSharingInvitations } from '@/modules/workspaces-sharing-invitations/entities/workspaces-sharing-invitations.entity';
function getRandomStatus() {
  return Math.random() < 0.5
    ? StatusInvitation.PENDING
    : StatusInvitation.ACCEPTED;
}

export async function seedWorkspaceInvitations() {
  const userRepository = AppDataSource.getRepository(User);
  const workspaceRepository = AppDataSource.getRepository(Workspace);
  const invitationRepository = AppDataSource.getRepository(
    WorkspacesSharingInvitations,
  );
  const users = await userRepository.find();
  const workspaces: Workspace[] = [];
  for (const user of users) {
    const workspace = await workspaceRepository.findOne({
      where: { owner: { id: user.id } },
      relations: ['owner'],
    });
    workspaces.push(workspace);
  }

  for (const workspace of workspaces) {
    const randomUsers = users.sort(() => 0.5 - Math.random()).slice(0, 10);

    for (const user of randomUsers) {
      const invitation = invitationRepository.create({
        owner: workspace.owner,
        workspace: workspace,
        email:
          user.email !== workspace.owner.email
            ? user.email
            : faker.internet.email(),
        status: getRandomStatus(),
      });

      await invitationRepository.save(invitation);
      if (invitation.status === 'ACCEPTED') {
        const workspace = await workspaceRepository.findOne({
          where: { id: invitation.workspace.id },
          relations: ['members'],
        });

        if (workspace) {
          await workspaceRepository.save(workspace);
        }
      }
    }
  }
}
