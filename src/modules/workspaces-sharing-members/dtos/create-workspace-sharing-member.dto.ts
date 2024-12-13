import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

import { RoleAccess } from '@/common/enums';
import { User } from '@/modules/user/entities/user.entity';
import { Workspace } from '@/modules/workspace/entities/workspace.entity';

export class CreateWorkspaceSharingMemberDto {
  @IsString({ message: 'workspace must be a string' })
  @IsNotEmpty({ message: 'workspace is required' })
  @ApiProperty()
  workspace: Workspace;

  @IsString({ message: 'member must be a string' })
  @IsNotEmpty({ message: 'member is required' })
  @ApiProperty()
  member: User;

  @IsString({ message: 'roleAccess must be a array' })
  @IsNotEmpty({ message: 'roleAccess is required' })
  @ApiProperty()
  roleAccess: RoleAccess;
}
