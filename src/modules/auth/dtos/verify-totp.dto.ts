import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyTotpDto {
  @IsString({ message: 'userId must be a string' })
  @IsNotEmpty({ message: 'userId is not empty' })
  @ApiProperty()
  userId: string;

  @IsString({ message: 'Token must be a string' })
  @IsNotEmpty({ message: 'Token is not empty' })
  @ApiProperty()
  token: string;
}
