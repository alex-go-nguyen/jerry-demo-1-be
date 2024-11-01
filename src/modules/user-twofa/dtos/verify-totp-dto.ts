import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyTotpDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  secret: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  token: string;
}
