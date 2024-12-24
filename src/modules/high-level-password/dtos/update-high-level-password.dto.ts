import { PartialType } from '@nestjs/swagger';

import { CreateHighLevelPasswordDto } from './create-high-level-password.dto';

export class UpdateHighLevelPasswordDto extends PartialType(
  CreateHighLevelPasswordDto,
) {}
