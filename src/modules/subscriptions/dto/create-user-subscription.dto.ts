import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { Column } from 'typeorm';

export class CreateUserSubscriptionDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'SubscriptionId is required' })
  @IsString({ message: 'SubscriptionId must be a string' })
  @Column()
  subscriptionId: string;
}
