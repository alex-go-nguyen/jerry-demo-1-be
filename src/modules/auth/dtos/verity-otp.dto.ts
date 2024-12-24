import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @ApiProperty()
  email: string;

  @IsString({ message: 'OTP must be a string' })
  @ApiProperty()
  otp: string;
}
