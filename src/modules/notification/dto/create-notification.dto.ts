import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateNotificationDto {
  @ApiProperty()
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is not empty' })
  title: string;

  @ApiProperty()
  @IsString({ message: 'Body must be a string' })
  @IsNotEmpty({ message: 'Body is not empty' })
  body: string;

  @ApiProperty()
  @IsString({ message: 'Token must be a string' })
  @IsNotEmpty({ message: 'Token is not empty' })
  token: string;
}
