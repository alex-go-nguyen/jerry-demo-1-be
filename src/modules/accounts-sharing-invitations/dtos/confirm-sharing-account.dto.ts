import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ConfirmSharingAccounntDto {
  @IsString({ message: 'InviteId must be a string' })
  @IsNotEmpty({ message: 'InviteId is required' })
  @ApiProperty()
  inviteId: string;
}
