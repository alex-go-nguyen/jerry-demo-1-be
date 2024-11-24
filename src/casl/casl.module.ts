import { Module } from '@nestjs/common';

import { CaslAbilityFactory } from './casl-ability.factory';
import { CaslAbilityWorkspaceFactory } from './casl-ability-workspace';

@Module({
  providers: [CaslAbilityFactory, CaslAbilityWorkspaceFactory],
  exports: [CaslAbilityFactory, CaslAbilityWorkspaceFactory],
})
export class CaslModule {}
