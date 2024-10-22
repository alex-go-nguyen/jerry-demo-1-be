import { IsNotEmpty, IsString } from 'class-validator';

import { ApiProperty, OmitType } from '@nestjs/swagger';

import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends OmitType(CreateUserDto, [
  'password',
] as const) {
  @IsString({ message: 'Name must be a string' })
  @ApiProperty()
  avatar: string;

  @IsNotEmpty({ message: 'Email is required' })
  @ApiProperty()
  phoneNumber: string;
}
