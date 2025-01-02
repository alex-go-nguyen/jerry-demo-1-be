import { Module } from '@nestjs/common';

import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@/modules/user/entities/user.entity';
import { StripeProvider } from '@/modules/stripe/stripe.provider';
import { SubscriptionsModule } from '@/modules/subscriptions/subscriptions.module';
import { AuthModule } from '@/modules/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), SubscriptionsModule, AuthModule],
  controllers: [StripeController],
  providers: [StripeService, StripeProvider],
})
export class StripeModule {}
