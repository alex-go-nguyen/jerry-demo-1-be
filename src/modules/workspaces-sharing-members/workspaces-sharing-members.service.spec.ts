import { In } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';

import { ErrorCode, RoleAccess } from '@/common/enums';
import { AccountsSharingMembersService } from '@/modules/accounts-sharing-members/accounts-sharing-members.service';
import { AccountsSharingMembers } from '@/modules/accounts-sharing-members/entities/accounts-sharing-members.entity';

import { WorkspacesSharingMembersService } from './workspaces-sharing-members.service';
import { WorkspacesSharingMembers } from './entities/workspaces-sharing-members.entity';
import { UserTwoFa } from '../user-twofa/entities/user-two-fa.entity';
import { UpdateWorkspaceSharingMemberDto } from './dtos';
import { Workspace } from '../workspace/entities/workspace.entity';

const workspaceSharingMemberData = {
  workspace: {
    id: 'workspace1',
    name: 'Sample Workspace',
    accounts: [
      {
        id: '123',
        domain: 'test.domain.com',
        username: 'test',
        password: 'test',
        workspaces: [],
        members: [],
        owner: {
          id: 'owner_id',
          name: 'Mock User',
          role: 'user',
          email: 'user@example.com',
          avatar: 'avatar_url',
          password: '',
          phoneNumber: '',
          isAuthenticated: false,
          userTwoFa: new UserTwoFa(),
          highLevelPasswords: [],
          accounts: [],
          sharedAccounts: [],
          contactInfos: [],
          loginHistories: [],
          workspaces: [],
          sharedWorkspaces: [],
          createdAt: undefined,
          updatedAt: undefined,
        },
        versions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    owner: {
      id: 'owner_id',
      name: 'Mock User',
      role: 'user',
      email: 'user@example.com',
      avatar: 'avatar_url',
      password: '',
      phoneNumber: '',
      isAuthenticated: false,
      userTwoFa: new UserTwoFa(),
      highLevelPasswords: [],
      accounts: [],
      sharedAccounts: [],
      contactInfos: [],
      loginHistories: [],
      workspaces: [],
      sharedWorkspaces: [],
      createdAt: undefined,
      updatedAt: undefined,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    members: [],
  },
  member: {
    id: 'member_id',
    name: 'Mock User',
    role: 'user',
    email: 'member@example.com',
    avatar: 'avatar_url',
    password: '',
    phoneNumber: '',
    isAuthenticated: false,
    userTwoFa: new UserTwoFa(),
    highLevelPasswords: [],
    accounts: [],
    sharedAccounts: [],
    contactInfos: [],
    loginHistories: [],
    workspaces: [],
    sharedWorkspaces: [],
    createdAt: undefined,
    updatedAt: undefined,
  },
  roleAccess: RoleAccess.READ,
  create: jest.fn(),
};

describe('WorkspacesSharingMembersService', () => {
  let service: WorkspacesSharingMembersService;

  const mockWorkspacesSharingMembersRepository = {
    find: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findOne: jest.fn(),
  };

  const mockAccountsSharingMembersRepository = {
    save: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
  };

  const mockWorkspaceRepository = {
    findOne: jest.fn(),
  };

  const mockAccountsSharingMembersService = {
    create: jest.fn(),
    updateRoleAccess: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspacesSharingMembersService,
        {
          provide: getRepositoryToken(WorkspacesSharingMembers),
          useValue: mockWorkspacesSharingMembersRepository,
        },
        {
          provide: getRepositoryToken(AccountsSharingMembers),
          useValue: mockAccountsSharingMembersRepository,
        },
        {
          provide: getRepositoryToken(Workspace),
          useValue: mockWorkspaceRepository,
        },
        {
          provide: AccountsSharingMembersService,
          useValue: mockAccountsSharingMembersService,
        },
      ],
    }).compile();

    service = module.get<WorkspacesSharingMembersService>(
      WorkspacesSharingMembersService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should save workspace sharing member and create account sharing members', async () => {
      await service.create(workspaceSharingMemberData);

      expect(mockWorkspacesSharingMembersRepository.save).toHaveBeenCalledWith(
        workspaceSharingMemberData,
      );
      expect(mockAccountsSharingMembersService.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('getWorkspacesByMember', () => {
    it('should return workspaces by member ID', async () => {
      const memberId = 'member1';
      const mockWorkspaces = [{ id: 'workspace1' }, { id: 'workspace2' }];
      mockWorkspacesSharingMembersRepository.find.mockResolvedValue(
        mockWorkspaces,
      );

      const result = await service.getWorkspacesByMember(memberId);

      expect(mockWorkspacesSharingMembersRepository.find).toHaveBeenCalledWith({
        where: { memberId },
      });
      expect(result).toEqual(mockWorkspaces);
    });
  });

  describe('updateRoleAccess', () => {
    it('should update role access and synchronize accounts', async () => {
      const updateData: UpdateWorkspaceSharingMemberDto = {
        workspaceId: 'workspace1',
        ownerId: 'owner1',
        sharingMembers: [
          {
            id: 'member1',
            roleAccess: RoleAccess.UPDATE,
            email: 'member1@gmail.com',
          },
          {
            id: 'member2',
            roleAccess: RoleAccess.READ,
            email: 'member2@gmail.com',
          },
        ],
      };

      const existedSharingMembers = [
        { member: { id: 'member1' }, roleAccess: RoleAccess.READ },
        { member: { id: 'member2' }, roleAccess: RoleAccess.UPDATE },
        { member: { id: 'member3' }, roleAccess: RoleAccess.UPDATE },
      ];

      mockWorkspacesSharingMembersRepository.find.mockResolvedValue(
        existedSharingMembers,
      );

      mockWorkspacesSharingMembersRepository.delete.mockResolvedValue({
        affected: 1,
      });

      mockWorkspacesSharingMembersRepository.update.mockResolvedValue({
        affected: 1,
      });

      mockWorkspacesSharingMembersRepository.findOne.mockResolvedValue({
        workspace: {
          accounts: [{ id: 'account1' }, { id: 'account2' }],
        },
      });

      mockWorkspaceRepository.findOne.mockResolvedValue({
        id: 'workspace1',
        accounts: [{ id: 'account1' }, { id: 'account2' }],
      });

      mockAccountsSharingMembersService.updateRoleAccess.mockResolvedValue(
        true,
      );

      await service.updateRoleAccess(updateData);

      expect(
        mockWorkspacesSharingMembersRepository.delete,
      ).toHaveBeenCalledWith({
        workspaceId: 'workspace1',
        member: { id: 'member3' },
      });

      expect(
        mockWorkspacesSharingMembersRepository.update,
      ).toHaveBeenCalledTimes(2);

      expect(
        mockWorkspacesSharingMembersRepository.update,
      ).toHaveBeenCalledWith(
        { workspaceId: 'workspace1', member: { id: 'member1' } },
        { roleAccess: RoleAccess.UPDATE },
      );

      expect(
        mockWorkspacesSharingMembersRepository.update,
      ).toHaveBeenCalledWith(
        { workspaceId: 'workspace1', member: { id: 'member2' } },
        { roleAccess: RoleAccess.READ },
      );

      expect(
        mockAccountsSharingMembersService.updateRoleAccess,
      ).toHaveBeenCalledWith({
        accountId: 'account1',
        ownerId: 'owner1',
        sharingMembers: updateData.sharingMembers,
      });

      expect(
        mockAccountsSharingMembersService.updateRoleAccess,
      ).toHaveBeenCalledWith({
        accountId: 'account2',
        ownerId: 'owner1',
        sharingMembers: updateData.sharingMembers,
      });
    });

    it('should throw an error if a member to update does not exist', async () => {
      const updateData: UpdateWorkspaceSharingMemberDto = {
        workspaceId: 'workspace1',
        ownerId: 'owner1',
        sharingMembers: [
          {
            id: 'member1',
            roleAccess: RoleAccess.READ,
            email: 'member1@gmail.com',
          },
        ],
      };

      mockWorkspacesSharingMembersRepository.find.mockResolvedValue([
        { member: { id: 'member1' } },
      ]);

      mockWorkspacesSharingMembersRepository.update.mockResolvedValue({
        affected: 0,
      });

      await expect(service.updateRoleAccess(updateData)).rejects.toThrow(
        'MEMBER_NOT_FOUND: Member ID member1 not found in workspace workspace1',
      );
    });

    it('should throw an error if the workspace does not exist', async () => {
      const updateData: UpdateWorkspaceSharingMemberDto = {
        workspaceId: 'workspace1',
        ownerId: 'owner1',
        sharingMembers: [],
      };

      mockWorkspaceRepository.findOne.mockResolvedValue(null);

      await expect(service.updateRoleAccess(updateData)).rejects.toThrow(
        ErrorCode.WORKSPACE_NOT_FOUND,
      );
    });
  });

  describe('updateAccountsSharingFromWorkspace', () => {
    it('should delete removed accounts and add new accounts for workspace members', async () => {
      const input = {
        workspaceId: 'workspace1',
        newAccountIds: ['account3'],
        removedAccountIds: ['account1'],
        userId: 'member3',
      };

      const mockWorkspaceMembers = [
        { member: { id: 'member1' }, roleAccess: RoleAccess.UPDATE },
        { member: { id: 'member2' }, roleAccess: RoleAccess.READ },
        { member: { id: 'member3' }, roleAccess: RoleAccess.READ },
      ];

      mockWorkspacesSharingMembersRepository.find.mockResolvedValue(
        mockWorkspaceMembers,
      );

      const mockCreatedEntries = [
        {
          account: { id: 'account3' },
          member: { id: 'member1' },
          roleAccess: RoleAccess.UPDATE,
        },
        {
          account: { id: 'account3' },
          member: { id: 'member2' },
          roleAccess: RoleAccess.READ,
        },
      ];

      mockAccountsSharingMembersRepository.delete.mockResolvedValue({
        affected: 1,
      });
      mockAccountsSharingMembersRepository.create.mockImplementation(
        (entry) => entry,
      );
      mockAccountsSharingMembersRepository.save.mockResolvedValue(
        mockCreatedEntries,
      );

      await service.updateAccountsSharingFromWorkspace(input);

      expect(mockWorkspacesSharingMembersRepository.find).toHaveBeenCalledWith({
        where: { workspaceId: 'workspace1' },
        relations: ['member'],
      });

      expect(mockAccountsSharingMembersRepository.delete).toHaveBeenCalledWith({
        accountId: In(['account1']),
        memberId: In(['member1', 'member2', 'member3']),
      });

      expect(mockAccountsSharingMembersRepository.save).toHaveBeenCalledWith([
        {
          account: { id: 'account3' },
          member: { id: 'member1' },
          roleAccess: RoleAccess.UPDATE,
        },
        {
          account: { id: 'account3' },
          member: { id: 'member2' },
          roleAccess: RoleAccess.READ,
        },
      ]);
    });

    it('should handle cases where there are no accounts to remove or add', async () => {
      const input = {
        workspaceId: 'workspace1',
        newAccountIds: [],
        removedAccountIds: [],
      };

      const mockWorkspaceMembers = [
        { member: { id: 'member1' }, roleAccess: RoleAccess.UPDATE },
        { member: { id: 'member2' }, roleAccess: RoleAccess.READ },
      ];

      mockWorkspacesSharingMembersRepository.find.mockResolvedValue(
        mockWorkspaceMembers,
      );

      await service.updateAccountsSharingFromWorkspace(input);

      expect(
        mockAccountsSharingMembersRepository.delete,
      ).not.toHaveBeenCalled();
      expect(mockAccountsSharingMembersRepository.save).not.toHaveBeenCalled();
    });

    it('should exclude the userId from being added to new accounts', async () => {
      const input = {
        workspaceId: 'workspace1',
        newAccountIds: ['account3'],
        removedAccountIds: [],
        userId: 'member2',
      };

      const mockWorkspaceMembers = [
        { member: { id: 'member1' }, roleAccess: RoleAccess.UPDATE },
        { member: { id: 'member2' }, roleAccess: RoleAccess.READ },
      ];

      mockWorkspacesSharingMembersRepository.find.mockResolvedValue(
        mockWorkspaceMembers,
      );

      const mockCreatedEntries = [
        {
          account: { id: 'account3' },
          member: { id: 'member1' },
          roleAccess: RoleAccess.UPDATE,
        },
      ];

      mockAccountsSharingMembersRepository.create.mockImplementation(
        (entry) => entry,
      );
      mockAccountsSharingMembersRepository.save.mockResolvedValue(
        mockCreatedEntries,
      );

      await service.updateAccountsSharingFromWorkspace(input);

      expect(mockAccountsSharingMembersRepository.save).toHaveBeenCalledWith([
        {
          account: { id: 'account3' },
          member: { id: 'member1' },
          roleAccess: RoleAccess.UPDATE,
        },
      ]);

      expect(
        mockAccountsSharingMembersRepository.save,
      ).not.toHaveBeenCalledWith(
        expect.objectContaining({
          member: { id: 'member2' },
        }),
      );
    });
  });
});
