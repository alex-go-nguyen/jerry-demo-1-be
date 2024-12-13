import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

import { RoleAccess } from '@/common/enums';

export class CreateWorkspacesSharingInvitationsDto {
  @IsString({ message: 'workspaceId must be a string' })
  @IsNotEmpty({ message: 'workspaceId is required' })
  @ApiProperty()
  workspaceId: string;

  @IsString({ message: 'ownerId must be a string' })
  @IsNotEmpty({ message: 'ownerId is required' })
  @ApiProperty()
  ownerId: string;

  @IsArray({ message: 'sharingMembers must be a array' })
  @IsNotEmpty({ message: 'sharingMembers is required' })
  @ApiProperty()
  sharingMembers: {
    email: string;
    roleAccess: RoleAccess;
  }[];
}
