import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User } from '@/modules/user/entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { SubscriptionPlanNames } from '@/common/enums';
import { SubscriptionPlan } from '@/modules/subscriptions/entities/subscription-plan.entity';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,

    @InjectRepository(User) private readonly userRepository: Repository<User>,

    @InjectRepository(SubscriptionPlan)
    private readonly subscriptionPlanRepository: Repository<SubscriptionPlan>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const limitType = this.reflector.get<string>(
      'checkLimitType',
      context.getHandler(),
    );
    if (!limitType) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: User = request.user;

    let userWithSubscription = await this.userRepository.findOne({
      where: { id: user.id },
      relations: ['subscription', 'accounts', 'workspaces'],
    });

    if (!userWithSubscription) {
      throw new ForbiddenException('User not found.');
    }

    if (!userWithSubscription.subscription) {
      const freePlan = await this.subscriptionPlanRepository.findOne({
        where: { name: SubscriptionPlanNames.FREE },
      });

      if (!freePlan) {
        throw new ForbiddenException(
          'Default subscription plan (FREE) is not configured.',
        );
      }

      userWithSubscription.subscription = freePlan;

      userWithSubscription =
        await this.userRepository.save(userWithSubscription);
    }

    const { subscription } = userWithSubscription;

    if (limitType === 'accounts') {
      const accountCount = userWithSubscription.accounts.length;
      if (accountCount >= subscription.maxAccounts) {
        throw new ForbiddenException(
          `You have reached the maximum account limit of ${subscription.maxAccounts} for your current subscription plan.`,
        );
      }
      if (subscription.maxAccounts === -1) {
        return true;
      }
    } else if (limitType === 'workspaces') {
      const workspaceCount = userWithSubscription.workspaces.length;
      if (workspaceCount >= subscription.maxWorkspaces) {
        throw new ForbiddenException(
          `You have reached the maximum workspace limit of ${subscription.maxWorkspaces} for your current subscription plan.`,
        );
      }
      if (subscription.maxWorkspaces === -1) {
        return true;
      }
    }

    return true;
  }
}
