import { ApiTags } from '@nestjs/swagger';
import { Solver } from '@2captcha/captcha-solver';
import { Controller, Get, Query } from '@nestjs/common';

import { CreateCaptchaDto } from './dto/create-captcha.dto';

interface CaptchaAnswer {
  id: string;
  data: string;
}

@ApiTags('Captcha')
@Controller('captcha')
export class CaptchaController {
  constructor() {}

  @Get('')
  async solveCaptcha(@Query() query: CreateCaptchaDto): Promise<CaptchaAnswer> {
    const apiKey = process.env.CAPTCHA_API_KEY;
    const pollingInterval = 10;
    const solver = new Solver(apiKey, pollingInterval);
    try {
      const res = await solver.recaptcha(query);
      return res;
    } catch (err) {
      throw err;
    }
  }
}
