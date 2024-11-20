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

      if (roleAccess === RoleAccess.Read) {
        can(RoleAccess.Read, Account, { id: accountId });
      } else if (roleAccess === RoleAccess.Update) {
        can(RoleAccess.Read, Account, { id: accountId });
        can(RoleAccess.Update, Account, { id: accountId });
      } else if (roleAccess === RoleAccess.Manage) {
        can(RoleAccess.Read, Account, { id: accountId });
        can(RoleAccess.Update, Account, { id: accountId });
        can(RoleAccess.Manage, Account, { id: accountId });
      }
    });

    return build({
      detectSubjectType: (item) =>
        item.constructor as ExtractSubjectType<Subjects>,
    });
  }
}
