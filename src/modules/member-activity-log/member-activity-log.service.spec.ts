import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { EntityType, RoleAccess } from '@/common/enums';

import { MemberActivityLogService } from './member-activity-log.service';
import { MemberActivityLog } from './entities/member-activity-log.entity';
import { CreateMemberActivityLogDto } from './dtos/create-member-activity-log.dto';

describe('MemberActivityLogService', () => {
  let service: MemberActivityLogService;

  const mockMemberActivityLogRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemberActivityLogService,
        {
          provide: getRepositoryToken(MemberActivityLog),
          useValue: mockMemberActivityLogRepository,
        },
      ],
    }).compile();

    service = module.get<MemberActivityLogService>(MemberActivityLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a member activity log', async () => {
      const createMemberActivityLogDto: CreateMemberActivityLogDto = {
        accountId: 'account-1',
        workspaceId: 'workspace-1',
        entityType: EntityType.WORKSPACE,
        action: RoleAccess.CREATE,
      };

      const mockActivityLog = {
        id: 'log-1',
        account: { id: 'account-1' },
        workspace: { id: 'workspace-1' },
        entityType: EntityType.WORKSPACE,
        action: RoleAccess.CREATE,
      };

      mockMemberActivityLogRepository.create.mockReturnValue(mockActivityLog);
      mockMemberActivityLogRepository.save.mockResolvedValue(mockActivityLog);

      const result = await service.create(createMemberActivityLogDto);

      expect(mockMemberActivityLogRepository.create).toHaveBeenCalledWith({
        account: { id: 'account-1' },
        workspace: { id: 'workspace-1' },
        entityType: EntityType.WORKSPACE,
        action: RoleAccess.CREATE,
      });

      expect(mockMemberActivityLogRepository.save).toHaveBeenCalledWith(
        mockActivityLog,
      );
      expect(result).toEqual(mockActivityLog);
    });
  });
});
