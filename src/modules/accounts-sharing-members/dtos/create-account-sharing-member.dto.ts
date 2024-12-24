import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

import { RoleAccess } from '@/common/enums';
import { User } from '@/modules/user/entities/user.entity';
import { Account } from '@/modules/account/entities/account.entity';

export class CreateAccountSharingMemberDto {
  @IsNotEmpty({ message: 'account is required' })
  @ApiProperty()
  account: Account;

  @IsNotEmpty({ message: 'member is required' })
  @ApiProperty()
  member: Partial<User>;

  @IsString({ message: 'roleAccess must be a string' })
  @IsNotEmpty({ message: 'roleAccess is required' })
  @ApiProperty()
  roleAccess: RoleAccess;
}
