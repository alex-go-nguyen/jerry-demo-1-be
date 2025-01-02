import {
  Body,
  Controller,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '@/decorators';
import { User } from '@/modules/user/entities/user.entity';
import { StripeService } from '@/modules/stripe/stripe.service';
import { CreateStripeUrlDto } from '@/modules/stripe/dto';
import { AuthGuard } from '@/modules/auth/auth.guard';

@Controller('stripe')
@UseGuards(AuthGuard)
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('/create-payment-url')
  @HttpCode(201)
  @ApiCreatedResponse({
    description: 'Stripe payment url created successfully!',
  })
  @ApiBadRequestResponse({ description: 'Missing input!' })
  @ApiBody({
    description: 'Data to create stripe url',
    type: CreateStripeUrlDto,
  })
  async createStripeUrl(
    @Body() createSubscriptionDto: CreateStripeUrlDto,
    @CurrentUser() user: User,
  ) {
    try {
      return await this.stripeService.createStripeUrl(
        createSubscriptionDto,
        user,
      );
    } catch (error) {
      throw error;
    }
  }

  @Patch('/verify-payment')
  @HttpCode(200)
  async verifyPayment(@CurrentUser() user: User) {
    try {
      return await this.stripeService.verifyPayment(user);
    } catch (error) {
      throw error;
    }
  }
}
