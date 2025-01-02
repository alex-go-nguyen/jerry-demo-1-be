import { VerifyPaymentStatus } from '@/common/enums';
import { CreateStripeUrlDto } from '@/modules/stripe/dto';
import { SubscriptionsService } from '@/modules/subscriptions/subscriptions.service';
import { User } from '@/modules/user/entities/user.entity';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Stripe from 'stripe';
import { Repository } from 'typeorm';

@Injectable()
export class StripeService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly subscriptionsService: SubscriptionsService,

    @Inject('STRIPE_CLIENT')
    private readonly stripe: Stripe,
  ) {}

  async createStripeUrl(createStripeUrlDto: CreateStripeUrlDto, user: User) {
    const upgradedUser = await this.subscriptionsService.checkSubscriptionTier(
      createStripeUrlDto,
      user,
    );

    const lineItems = [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Upgrade account to ${upgradedUser.toUpgradeSubscription.name} subscription plan.`,
            description: upgradedUser.toUpgradeSubscription.description,
          },
          unit_amount: upgradedUser.toUpgradeSubscription.price * 100,
        },
        quantity: 1,
      },
    ];
    const returnUrl = `${process.env.CLIENT_URLS.split(',')[0]}/verify-payment/?userId=${user.id}&sessionId={CHECKOUT_SESSION_ID}`;
    const session = await this.stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: 'payment',
      metadata: {
        userId: user.id,
      },
      expand: ['payment_intent'],
      success_url: returnUrl,
      cancel_url: returnUrl,
    });
    upgradedUser.subscriptionPaymentId = session.id;
    await this.userRepository.save(upgradedUser);

    return session.url;
  }

  async verifyPayment(user: User) {
    const existedUser = await this.userRepository.findOne({
      where: {
        id: user.id,
      },
      relations: { subscription: true, toUpgradeSubscription: true },
    });

    const session = await this.stripe.checkout.sessions.retrieve(
      existedUser.subscriptionPaymentId,
    );

    if (session.payment_status === 'paid') {
      const paymentIntentId = session.payment_intent as Stripe.PaymentIntent;

      await this.stripe.paymentIntents.update(paymentIntentId.toString(), {
        metadata: {
          userId: user.id,
        },
      });

      existedUser.subscription = existedUser.toUpgradeSubscription;
      existedUser.toUpgradeSubscription = null;
      await this.userRepository.save(existedUser);
      return {
        status: VerifyPaymentStatus.Success,
        message: 'Thanh toán thành công',
      };
    } else {
      return {
        status: VerifyPaymentStatus.Failed,
        message: 'Thanh toán không thành công',
      };
    }
  }
}
