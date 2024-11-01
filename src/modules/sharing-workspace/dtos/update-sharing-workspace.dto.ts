import { PartialType } from '@nestjs/swagger';
import { CreateSharingWorkspaceDto } from './create-sharing-workspace.dto';

export class UpdateSharingWorkspaceDto extends PartialType(
  CreateSharingWorkspaceDto,
) {}
