import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { NestjsFingerprintModule } from 'nestjs-fingerprint';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';

import { CaslModule } from '@/casl/casl.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { UsersModule } from '@/modules/user/user.module';
import { DatabaseModule } from '@/database/database.module';
import { AccountModule } from '@/modules/account/account.module';
import { DashboardModule } from '@/modules/dashboard/dashboard.module';
import { WorkspaceModule } from '@/modules/workspace/workspace.module';
import { TwoFactorAuthModule } from '@/modules/user-twofa/user-twofa.module';
import { ContactInfoModule } from '@/modules/contact-info/contact-info.module';
import { NotificationModule } from '@/modules/notification/notification.module';
import { LoginHistoryModule } from '@/modules/login-history/login-history.module';
import { HighLevelPasswordModule } from '@/modules/high-level-password/high-level-password.module';
import { MemberActivityLogModule } from '@/modules/member-activity-log/member-activity-log.module';
import { NotificationDetailModule } from '@/modules/notification-detail/notification-detail.module';
import { AccountsSharingMembersModule } from '@/modules/accounts-sharing-members/accounts-sharing-members.module';
import { WorkspacesSharingMembersModule } from '@/modules/workspaces-sharing-members/workspaces-sharing-members.module';
import { SharingWorkspaceModule } from '@/modules/workspaces-sharing-invitations/workspaces-sharing-invitations.module';
import { AccountsSharingInvitationsModule } from '@/modules/accounts-sharing-invitations/accounts-sharing-invitations.module';
import { AccountVersionModule } from '@/modules/account-version/account-version.module';
import { CaptchaModule } from '@/modules/captcha/captcha.module';
import { StripeModule } from '@/modules/stripe/stripe.module';
import { SubscriptionsModule } from '@/modules/subscriptions/subscriptions.module';

@Module({
  imports: [
    NestjsFingerprintModule.forRoot({
      params: ['headers', 'userAgent', 'ipAddress'],
      cookieOptions: {
        name: 'login_history',
        httpOnly: true,
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MailerModule.forRoot({
      transport: {
        host: process.env.EMAIL_HOST,
        port: +process.env.EMAIL_PORT,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        tls: {
          rejectUnauthorized: false,
        },
      },
      defaults: {
        from: process.env.EMAIL_SENDER,
      },
      template: {
        dir: './dist/templates/',
        adapter: new EjsAdapter({ inlineCssEnabled: true }),
        options: {
          strict: false,
        },
      },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: +process.env.TIME_TO_LIVE,
        limit: +process.env.RATE_LIMIT,
      },
    ]),
    DatabaseModule,
    AuthModule,
    UsersModule,
    AccountModule,
    DashboardModule,
    WorkspaceModule,
    SharingWorkspaceModule,
    TwoFactorAuthModule,
    ContactInfoModule,
    LoginHistoryModule,
    CaslModule,
    AccountsSharingMembersModule,
    AccountsSharingInvitationsModule,
    WorkspacesSharingMembersModule,
    HighLevelPasswordModule,
    NotificationModule,
    NotificationDetailModule,
    MemberActivityLogModule,
    AccountVersionModule,
    CaptchaModule,
    StripeModule,
    SubscriptionsModule,
  ],

  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
