import { AccountAbility } from '@/casl/casl-ability.factory';
import { WorkspaceAbility } from '@/casl/casl-ability-workspace';

interface IPolicyHandler {
  handle(ability: AccountAbility | WorkspaceAbility): boolean;
}

type PolicyHandlerCallback = (
  ability: AccountAbility | WorkspaceAbility,
) => boolean;

export type PolicyHandler = IPolicyHandler | PolicyHandlerCallback;
