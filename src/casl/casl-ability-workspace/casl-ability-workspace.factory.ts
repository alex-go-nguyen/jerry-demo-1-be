import {
  Ability,
  AbilityBuilder,
  AbilityClass,
  ExtractSubjectType,
  InferSubjects,
  PureAbility,
} from '@casl/ability';
import { Injectable } from '@nestjs/common';

import { RoleAccess } from '@/common/enums';
import { rolePermissionsMap } from '@/utils/constants';
import { User } from '@/modules/user/entities/user.entity';
import { Account } from '@/modules/account/entities/account.entity';
import { Workspace } from '@/modules/workspace/entities/workspace.entity';

type Subjects = InferSubjects<typeof Account | typeof Workspace>;

export type WorkspaceAbility = PureAbility<[RoleAccess, Subjects]>;

@Injectable()
export class CaslAbilityWorkspaceFactory {
  createForUser(user: User): WorkspaceAbility {
    const { can, build } = new AbilityBuilder<WorkspaceAbility>(
      Ability as AbilityClass<WorkspaceAbility>,
    );

    user.sharedWorkspaces.forEach((sharedWorkspace) => {
      const { workspaceId, roleAccess } = sharedWorkspace;
      rolePermissionsMap[roleAccess].forEach((permission) => {
        can(permission, Workspace, { id: workspaceId });
      });
    });

    return build({
      detectSubjectType: (item) =>
        item.constructor as ExtractSubjectType<Subjects>,
    });
  }
}
