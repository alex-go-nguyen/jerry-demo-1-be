import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import { CustomExceptionFilter } from '@/common/exceptions';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  const config = new DocumentBuilder()
    .setTitle('Go Password Manager api')
    .setDescription('The Go Password Manager API description')
    .setVersion('2.0')
    .addTag('Go Password Manager')
    .addServer('/api')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  const port = configService.get<number>('PORT') || 3000;

  SwaggerModule.setup('api', app, document);

  app.enableCors({
    origin: process.env.CLIENT_URLS.split(','),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );
  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new CustomExceptionFilter());

  const appRedis = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.REDIS,
      options: {
        host: configService.get<string>('REDIS_HOST'),
        port: configService.get<number>('REDIS_PORT'),
      },
    },
  );
  await app.listen(port);
  await appRedis.listen();
}
bootstrap();
