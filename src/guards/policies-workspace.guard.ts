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
  CaslAbilityWorkspaceFactory,
  WorkspaceAbility,
} from '@/casl/casl-ability-workspace';
import { WorkspaceService } from '@/modules/workspace/workspace.service';
import { Workspace } from '@/modules/workspace/entities/workspace.entity';
import { WorkspacesSharingMembersService } from '@/modules/workspaces-sharing-members/workspaces-sharing-members.service';

@Injectable()
export class PoliciesWorkspaceGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private caslAbilityWorkspaceFactory: CaslAbilityWorkspaceFactory,
    private readonly workspacesSharingMembersService: WorkspacesSharingMembersService,
    private readonly workspaceService: WorkspaceService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const policyHandlers =
      this.reflector.get<PolicyHandler[]>(
        CHECK_POLICIES_KEY,
        context.getHandler(),
      ) || [];

    const request = context.switchToHttp().getRequest();
    const { user, params, body } = request;

    const workspaceId = params.workspaceId || body.workspaceId;

    const isOwner = await this.workspaceService.checkOwner({
      ownerId: user.id,
      workspaceId,
    });

    if (isOwner) {
      return true;
    }

    const sharedWorkspaces =
      await this.workspacesSharingMembersService.getWorkspacesByMember(user.id);

    const isSharedWorkspace = sharedWorkspaces.some(
      (sharedWorkspace) => sharedWorkspace.workspaceId === workspaceId,
    );

    if (!isSharedWorkspace) {
      throw new ForbiddenException(
        'Access denied: You do not have permission for this workspace.',
      );
    }

    user.sharedWorkspaces = sharedWorkspaces;

    const ability = this.caslAbilityWorkspaceFactory.createForUser(user);

    const hasAccess = this.checkPermissions(ability, workspaceId);

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
    ability: WorkspaceAbility,
    workspaceId: string,
  ): boolean {
    return (
      ability.can(RoleAccess.MANAGE, Workspace, workspaceId) ||
      ability.can(RoleAccess.UPDATE, Workspace, workspaceId) ||
      ability.can(RoleAccess.READ, Workspace, workspaceId)
    );
  }

  private execPolicyHandler(
    handler: PolicyHandler,
    ability: WorkspaceAbility,
  ): boolean {
    if (typeof handler === 'function') {
      return handler(ability);
    }
    return handler.handle(ability);
  }
}
