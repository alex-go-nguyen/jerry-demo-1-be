import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '@/modules/auth/auth.module';

import { ContactInfoService } from './contact-info.service';
import { ContactInfo } from './entities/contact-info.entity';
import { ContactInfoController } from './contact-info.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ContactInfo]), AuthModule],
  controllers: [ContactInfoController],
  providers: [ContactInfoService],
})
export class ContactInfoModule {}
