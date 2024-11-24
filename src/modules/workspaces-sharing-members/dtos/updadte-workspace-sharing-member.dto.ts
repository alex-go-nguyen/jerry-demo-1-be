import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

import { RoleAccess } from '@/common/enums';

export class UpdateWorkspaceSharingMemberDto {
  @IsString({ message: 'workspaceId must be a string' })
  @IsNotEmpty({ message: 'workspaceId is required' })
  @ApiProperty()
  workspaceId: string;

  @IsString({ message: 'ownerId must be a string' })
  @IsNotEmpty({ message: 'ownerId is required' })
  @ApiProperty()
  ownerId: string;

  @IsString({ message: 'sharingMembers must be a array' })
  @IsNotEmpty({ message: 'sharingMembers is required' })
  @ApiProperty()
  sharingMembers: {
    id: string;
    email: string;
    roleAccess: RoleAccess;
  }[];
}
