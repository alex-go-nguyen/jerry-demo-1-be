import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

import { CreateWorkspaceDto } from './create-workspace.dto';

export class UpdateWorkspaceDto extends PartialType(CreateWorkspaceDto) {
  @IsString({ message: 'workspaceId must be a string' })
  @IsNotEmpty({ message: 'workspaceId is required' })
  @ApiProperty()
  workspaceId: string;
}
