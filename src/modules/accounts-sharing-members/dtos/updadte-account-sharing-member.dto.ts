import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

import { RoleAccess } from '@/common/enums';

export class UpdateAccountSharingMemberDto {
  @IsString({ message: 'accountId must be a string' })
  @IsNotEmpty({ message: 'accountId is required' })
  @ApiProperty()
  accountId: string;

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
