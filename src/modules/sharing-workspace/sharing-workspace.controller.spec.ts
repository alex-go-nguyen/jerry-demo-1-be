import { Test, TestingModule } from '@nestjs/testing';
import { SharingWorkspaceController } from './sharing-workspace.controller';
import { SharingWorkspaceService } from './sharing-workspace.service';

describe('SharingWorkspaceController', () => {
  let controller: SharingWorkspaceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SharingWorkspaceController],
      providers: [SharingWorkspaceService],
    }).compile();

    controller = module.get<SharingWorkspaceController>(
      SharingWorkspaceController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
