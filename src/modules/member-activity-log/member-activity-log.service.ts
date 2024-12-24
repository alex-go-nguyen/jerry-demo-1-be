import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { MemberActivityLog } from './entities/member-activity-log.entity';
import { CreateMemberActivityLogDto } from './dtos/create-member-activity-log.dto';

@Injectable()
export class MemberActivityLogService {
  constructor(
    @InjectRepository(MemberActivityLog)
    private readonly memberActivityLogRepository: Repository<MemberActivityLog>,
  ) {}

  async create(memberActivityLogData: CreateMemberActivityLogDto) {
    const { accountId, workspaceId, entityType, action } =
      memberActivityLogData;

    const activityLog = this.memberActivityLogRepository.create({
      account: accountId ? { id: accountId } : null,
      workspace: workspaceId ? { id: workspaceId } : null,
      entityType,
      action,
    });

    return this.memberActivityLogRepository.save(activityLog);
  }
}
