import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionPlanNames } from '@/common/enums';

export class CreateStripeUrlDto {
  @ApiProperty()
  @IsString({ message: 'SubscriptionPlanId must be a string' })
  @IsNotEmpty({ message: 'SubscriptionPlanId is required' })
  subscriptionPlanId: SubscriptionPlanNames;
}
