import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';

import { AuthModule } from '@/modules/auth/auth.module';
import { UsersModule } from '@/modules/user/user.module';
import { DatabaseModule } from '@/database/database.module';
import { AccountModule } from '@/modules/account/account.module';
import { DashboardModule } from '@/modules/dashboard/dashboard.module';
import { WorkspaceModule } from '@/modules/workspace/workspace.module';
import { TwoFactorAuthModule } from '@/modules/user-twofa/user-twofa.module';
import { ContactInfoModule } from '@/modules/contact-info/contact-info.module';
import { SharingWorkspaceModule } from '@/modules/sharing-workspace/sharing-workspace.module';

@Module({
  imports: [
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
  ],

  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
