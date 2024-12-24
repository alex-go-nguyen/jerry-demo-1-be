import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateCaptchaDto {
  @ApiProperty()
  @IsString({ message: 'pageurl must be a string' })
  pageurl: string;

  @ApiProperty()
  @IsString({ message: 'googlekey must be a string' })
  googlekey: string;
}
