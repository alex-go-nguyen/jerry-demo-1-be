import { Test, TestingModule } from '@nestjs/testing';
import { SharingWorkspaceService } from './sharing-workspace.service';

describe('SharingWorkspaceService', () => {
  let service: SharingWorkspaceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SharingWorkspaceService],
    }).compile();

    service = module.get<SharingWorkspaceService>(SharingWorkspaceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
