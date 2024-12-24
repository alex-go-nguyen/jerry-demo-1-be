import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAccountVersionDto {
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

  @IsString({ message: 'actorId must be a string' })
  @IsNotEmpty({ message: 'actorId is required' })
  @ApiProperty()
  actorId: string;

  @IsString({ message: 'accountId must be a string' })
  @IsNotEmpty({ message: 'accountId is required' })
  @ApiProperty()
  accountId: string;
}
