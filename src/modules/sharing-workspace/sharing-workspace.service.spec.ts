import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from '@nestjs-modules/mailer';

import { Repository } from 'typeorm';

import { ErrorCode } from '@/common/enums';

import { User } from '@/modules/user/entities/user.entity';
import { Workspace } from '@/modules/workspace/entities/workspace.entity';

import { SharingWorkspaceService } from './sharing-workspace.service';
import { WorkspaceSharingInvitation } from './entities/sharing-workspace.entity';

describe('SharingWorkspaceService', () => {
  let service: SharingWorkspaceService;
  let workspaceRepo: Repository<Workspace>;
  let userRepo: Repository<User>;
  let invitationRepo: Repository<WorkspaceSharingInvitation>;
  let mailerService: MailerService;

  const mockWorkspace = {
    id: '1',
    name: 'Test Workspace',
    owner: { id: 'ownerId', name: 'Owner' },
    members: [],
  };
  const mockUser = { id: 'userId', email: 'user@example.com', name: 'User' };
  const mockInvitation = {
    id: 'inviteId',
    email: 'user@example.com',
    status: 'PENDING',
    workspace: mockWorkspace,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SharingWorkspaceService,
        {
          provide: getRepositoryToken(WorkspaceSharingInvitation),
          useValue: {
            create: jest.fn().mockReturnValue(mockInvitation),
            save: jest.fn().mockResolvedValue(mockInvitation),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Workspace),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn().mockResolvedValue(mockWorkspace),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('http://localhost:3000'),
          },
        },
        {
          provide: MailerService,
          useValue: {
            sendMail: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    service = module.get<SharingWorkspaceService>(SharingWorkspaceService);
    workspaceRepo = module.get<Repository<Workspace>>(
      getRepositoryToken(Workspace),
    );
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
    invitationRepo = module.get<Repository<WorkspaceSharingInvitation>>(
      getRepositoryToken(WorkspaceSharingInvitation),
    );
    mailerService = module.get<MailerService>(MailerService);
  });

  describe('create', () => {
    it('should create an invitation and send an email', async () => {
      workspaceRepo.findOne = jest.fn().mockResolvedValue(mockWorkspace);
      userRepo.findOne = jest.fn().mockResolvedValue(mockUser);

      const createSharingWorkspaceDto = {
        workspaceId: '1',
        emails: ['user@example.com'],
      };

      const result = await service.create('ownerId', createSharingWorkspaceDto);

      expect(invitationRepo.save).toHaveBeenCalledWith(mockInvitation);
      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to: 'user@example.com',
        from: 'support@yourapp.com',
        subject: 'Workspace Invitation',
        template: 'invitation_email',
        context: {
          workspaceName: mockWorkspace.name,
          ownerName: mockWorkspace.owner.name,
          url: expect.any(String),
        },
      });
      expect(result).toEqual(mockInvitation);
    });

    it('should throw an error if workspace is not found', async () => {
      workspaceRepo.findOne = jest.fn().mockResolvedValue(null);
      const createSharingWorkspaceDto = {
        workspaceId: '1',
        emails: ['user@example.com'],
      };

      await expect(
        service.create('ownerId', createSharingWorkspaceDto),
      ).rejects.toThrow(ErrorCode.WORKSPACE_NOT_FOUND);
    });
  });

  describe('confirmInvitation', () => {
    it('should confirm an invitation and add the user to the workspace', async () => {
      invitationRepo.findOne = jest.fn().mockResolvedValue(mockInvitation);
      userRepo.findOne = jest.fn().mockResolvedValue(mockUser);
      workspaceRepo.findOne = jest.fn().mockResolvedValue(mockWorkspace);

      const result = await service.confirmInvitation('inviteId');

      expect(invitationRepo.save).toHaveBeenCalledWith({
        ...mockInvitation,
        status: 'ACCEPTED',
      });
      expect(mockWorkspace.members).toContain(mockUser);
      expect(result).toEqual({ message: 'Invitation accepted successfully' });
    });

    it('should throw an error if invitation is not found', async () => {
      invitationRepo.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.confirmInvitation('inviteId')).rejects.toThrow(
        ErrorCode.INVITATION_NOT_FOUND,
      );
    });

    it('should throw an error if user is not found', async () => {
      invitationRepo.findOne = jest.fn().mockResolvedValue(mockInvitation);
      userRepo.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.confirmInvitation('inviteId')).rejects.toThrow(
        ErrorCode.USER_NOT_FOUND,
      );
    });
  });
});
