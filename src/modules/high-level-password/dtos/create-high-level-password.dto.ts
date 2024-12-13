import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

import { TypeHighLevelPassword } from '@/common/enums';

export class CreateHighLevelPasswordDto {
  @IsString({ message: 'High level password must be a string' })
  @IsNotEmpty({ message: 'High level password is required' })
  @Length(4, 10, {
    message: 'High level password must be between 4 and 10 characters',
  })
  @ApiProperty()
  password: string;

  @IsOptional()
  @ApiProperty()
  type?: TypeHighLevelPassword;
}
