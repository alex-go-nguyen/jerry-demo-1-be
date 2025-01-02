import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '@/modules/user/entities/user.entity';
import { ErrorCode } from '@/common/enums';
import { SubscriptionPlan } from '@/modules/subscriptions/entities/subscription-plan.entity';
import { CreateSubscriptionPlanDto } from '@/modules/subscriptions/dto/create-subscription-plan.dto';
import { CreateStripeUrlDto } from '@/modules/stripe/dto';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(SubscriptionPlan)
    private readonly subscriptionPlanRepository: Repository<SubscriptionPlan>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createSubscriptionPlan(
    createSubscriptionPlanDto: CreateSubscriptionPlanDto,
  ) {
    const newSubscriptionPlan = this.subscriptionPlanRepository.create(
      createSubscriptionPlanDto,
    );
    return await this.subscriptionPlanRepository.save(newSubscriptionPlan);
  }

  async upgrade(createStripeUrlDto: CreateStripeUrlDto, user: User) {
    const existedUser = await this.userRepository.findOne({
      where: {
        id: user.id,
      },
      relations: {
        subscription: true,
      },
    });
    if (!existedUser) {
      throw new Error(ErrorCode.USER_NOT_FOUND);
    }
    const subscriptionPlan = await this.subscriptionPlanRepository.findOneBy({
      name: createStripeUrlDto.subscriptionPlanId,
    });
    if (existedUser.subscription.weights >= subscriptionPlan.weights) {
      throw new Error(
        ErrorCode.NEW_SUBSCRIPTION_HAS_LOWER_TIER_THAN_CURRENT_SUBSCRIPTION,
      );
    }
    existedUser.subscription = subscriptionPlan;
    return await this.userRepository.save(existedUser);
  }
  async checkSubscriptionTier(
    createStripeUrlDto: CreateStripeUrlDto,
    user: User,
  ) {
    if (!user) {
      throw new Error(ErrorCode.USER_NOT_FOUND);
    }
    const existedUser = await this.userRepository.findOne({
      where: {
        id: user.id,
      },
      relations: {
        subscription: true,
      },
    });
    if (!existedUser) {
      throw new Error(ErrorCode.USER_NOT_FOUND);
    }

    const subscriptionPlan = await this.subscriptionPlanRepository.findOneBy({
      name: createStripeUrlDto.subscriptionPlanId,
    });

    if (existedUser.subscription.weights >= subscriptionPlan.weights) {
      throw new Error(
        ErrorCode.NEW_SUBSCRIPTION_HAS_LOWER_TIER_THAN_CURRENT_SUBSCRIPTION,
      );
    }
    existedUser.toUpgradeSubscription = subscriptionPlan;
    return await this.userRepository.save(existedUser);
  }
}
