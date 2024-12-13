import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyTotpDto {
  @IsString({ message: 'Secrect must be a string' })
  @IsNotEmpty({ message: 'Secrect is required' })
  @ApiProperty()
  secret: string;

  @IsString({ message: 'Token must be a string' })
  @IsNotEmpty({ message: 'Token is required' })
  @ApiProperty()
  token: string;
}
