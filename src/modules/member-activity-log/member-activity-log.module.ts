import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MemberActivityLogService } from './member-activity-log.service';
import { MemberActivityLog } from './entities/member-activity-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MemberActivityLog])],
  controllers: [],
  providers: [MemberActivityLogService],
  exports: [MemberActivityLogService],
})
export class MemberActivityLogModule {}
