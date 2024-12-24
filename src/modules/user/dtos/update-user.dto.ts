import { IsOptional, IsString } from 'class-validator';

import { ApiProperty, OmitType } from '@nestjs/swagger';

import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends OmitType(CreateUserDto, [
  'password',
] as const) {
  @IsString({ message: 'Avatar must be a string' })
  @IsOptional()
  @ApiProperty()
  avatar?: string;

  @IsString({ message: 'Phone number must be a string' })
  @IsOptional()
  @ApiProperty()
  phoneNumber?: string;
}
