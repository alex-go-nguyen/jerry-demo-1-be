import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
} from '@nestjs/swagger';

import { CurrentUser } from '@/decorators';

import { User } from '@/modules/user/entities/user.entity';
import { SubscriptionsService } from '@/modules/subscriptions/subscriptions.service';
import { CreateSubscriptionPlanDto } from '@/modules/subscriptions/dto/create-subscription-plan.dto';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post('/create-subscription-plan')
  @HttpCode(201)
  @ApiCreatedResponse({
    description: 'Subscription plan created successfully!',
  })
  @ApiBadRequestResponse({ description: 'Missing input!' })
  @ApiBody({
    description: 'Data to create subscription plan',
    type: CreateSubscriptionPlanDto,
  })
  async createSubscriptionPlan(
    @Body() createSubscriptionPlanDto: CreateSubscriptionPlanDto,
  ) {
    try {
      return await this.subscriptionsService.createSubscriptionPlan(
        createSubscriptionPlanDto,
      );
    } catch (error) {
      throw error;
    }
  }
}
