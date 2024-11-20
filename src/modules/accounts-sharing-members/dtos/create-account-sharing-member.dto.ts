import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

import { RoleAccess } from '@/common/enums';
import { User } from '@/modules/user/entities/user.entity';
import { Account } from '@/modules/account/entities/account.entity';

export class CreateAccountSharingMemberDto {
  @IsString({ message: 'accountId must be a string' })
  @IsNotEmpty({ message: 'accountId is required' })
  @ApiProperty()
  account: Account;

  @IsString({ message: 'memberId must be a string' })
  @IsNotEmpty({ message: 'memberId is required' })
  @ApiProperty()
  member: User;

  @IsString({ message: 'roleAccess must be a array' })
  @IsNotEmpty({ message: 'roleAccess is required' })
  @ApiProperty()
  roleAccess: RoleAccess;
}
