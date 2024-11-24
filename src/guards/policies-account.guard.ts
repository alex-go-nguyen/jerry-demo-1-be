import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { RoleAccess } from '@/common/enums';
import { PolicyHandler } from '@/interfaces';
import { CHECK_POLICIES_KEY } from '@/decorators';
import {
  CaslAbilityFactory,
  AccountAbility,
} from '@/casl/casl-ability.factory';
import { AccountService } from '@/modules/account/account.service';
import { Account } from '@/modules/account/entities/account.entity';
import { AccountsSharingMembersService } from '@/modules/accounts-sharing-members/accounts-sharing-members.service';

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private caslAbilityFactory: CaslAbilityFactory,
    private readonly accountsSharingMembersService: AccountsSharingMembersService,
    private readonly accountService: AccountService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const policyHandlers =
      this.reflector.get<PolicyHandler[]>(
        CHECK_POLICIES_KEY,
        context.getHandler(),
      ) || [];

    const request = context.switchToHttp().getRequest();
    const { user, params, body } = request;

    const accountId = params.accountId || body.accountId;

    const isOwner = await this.accountService.checkOwner({
      ownerId: user.id,
      accountId,
    });

    if (isOwner) {
      return true;
    }

    const sharedAccounts =
      await this.accountsSharingMembersService.getAccountsByMember(user.id);

    const isSharedAccount = sharedAccounts.some(
      (sharedAccount) => sharedAccount.accountId === accountId,
    );

    if (!isSharedAccount) {
      throw new ForbiddenException(
        'Access denied: You do not have permission for this account.',
      );
    }

    user.sharedAccounts = sharedAccounts;

    const ability = this.caslAbilityFactory.createForUser(user);

    const hasAccess = this.checkPermissions(ability, accountId);

    const isPolicyValid = policyHandlers.every((handler) => {
      return this.execPolicyHandler(handler, ability);
    });

    if (!isPolicyValid || !hasAccess) {
      throw new ForbiddenException(
        'Access denied due to insufficient permissions.',
      );
    }

    return true;
  }

  private checkPermissions(
    ability: AccountAbility,
    accountId: string,
  ): boolean {
    return (
      ability.can(RoleAccess.MANAGE, Account, accountId) ||
      ability.can(RoleAccess.UPDATE, Account, accountId) ||
      ability.can(RoleAccess.READ, Account, accountId)
    );
  }

  private execPolicyHandler(
    handler: PolicyHandler,
    ability: AccountAbility,
  ): boolean {
    if (typeof handler === 'function') {
      return handler(ability);
    }
    return handler.handle(ability);
  }
}
