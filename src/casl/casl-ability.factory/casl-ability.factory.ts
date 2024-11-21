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

type Subjects = InferSubjects<typeof Account | typeof User> | 'all';

export type AppAbility = PureAbility<[RoleAccess, Subjects]>;

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: User): AppAbility {
    const { can, build } = new AbilityBuilder<AppAbility>(
      Ability as AbilityClass<AppAbility>,
    );

    user.sharedAccounts.forEach((sharedAccount) => {
      const { accountId, roleAccess } = sharedAccount;
      rolePermissionsMap[roleAccess].forEach((permission) => {
        can(permission, Account, { id: accountId });
      });
    });

    return build({
      detectSubjectType: (item) =>
        item.constructor as ExtractSubjectType<Subjects>,
    });
  }
}
