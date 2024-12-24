import { Module } from '@nestjs/common';
import { CaptchaController } from './captcha.controller';

@Module({
  controllers: [CaptchaController],
  providers: [],
})
export class CaptchaModule {}
