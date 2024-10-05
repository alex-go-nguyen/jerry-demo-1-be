import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAccountDto {
  @IsString({ message: 'Domain must be a string' })
  @IsNotEmpty({ message: 'Domain is required' })
  @ApiProperty()
  domain: string;

  @IsString({ message: 'username must be a string' })
  @IsNotEmpty({ message: 'username is required' })
  @ApiProperty()
  username: string;

  @IsString({ message: 'password must be a string' })
  @IsNotEmpty({ message: 'password is required' })
  @ApiProperty()
  password: string;
}
