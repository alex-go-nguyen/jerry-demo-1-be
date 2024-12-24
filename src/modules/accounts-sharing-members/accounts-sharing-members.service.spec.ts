import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';

import { ErrorCode, RoleAccess } from '@/common/enums';

import { User } from '@/modules/user/entities/user.entity';
import { UserTwoFa } from '@/modules/user-twofa/entities/user-two-fa.entity';

import { AccountsSharingMembersService } from './accounts-sharing-members.service';
import { AccountsSharingMembers } from './entities/accounts-sharing-members.entity';
import { CreateAccountSharingMemberDto } from './dtos/create-account-sharing-member.dto';
import { UpdateAccountSharingMemberDto } from './dtos/updadte-account-sharing-member.dto';

describe('AccountsSharingMembersService', () => {
  let service: AccountsSharingMembersService;

  const mockAccountsSharingMembersRepository = {
    find: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsSharingMembersService,
        {
          provide: getRepositoryToken(AccountsSharingMembers),
          useValue: mockAccountsSharingMembersRepository,
        },
      ],
    }).compile();

    service = module.get<AccountsSharingMembersService>(
      AccountsSharingMembersService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should save a new account sharing member', async () => {
      const createDto: CreateAccountSharingMemberDto = {
        account: {
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
          createdAt: undefined,
          updatedAt: undefined,
          versions: [],
        },
        roleAccess: RoleAccess.READ,
        member: new User(),
      };

      const savedMember = { ...createDto, id: '1' };
      mockAccountsSharingMembersRepository.save.mockResolvedValue(savedMember);

      const result = await service.create(createDto);
      expect(result).toEqual(savedMember);
      expect(mockAccountsSharingMembersRepository.save).toHaveBeenCalledWith(
        createDto,
      );
    });
  });

  describe('getAccountsByMember', () => {
    it('should return accounts for a given memberId', async () => {
      const memberId = '1';
      const mockAccounts = [
        { accountId: '123', memberId: memberId, roleAccess: RoleAccess.READ },
      ];
      mockAccountsSharingMembersRepository.find.mockResolvedValue(mockAccounts);

      const result = await service.getAccountsByMember(memberId);
      expect(result).toEqual(mockAccounts);
      expect(mockAccountsSharingMembersRepository.find).toHaveBeenCalledWith({
        where: { memberId },
      });
    });
  });

  describe('updateRoleAccess', () => {
    it('should update role access for existing sharing members', async () => {
      const updateDto: UpdateAccountSharingMemberDto = {
        accountId: '123',
        sharingMembers: [
          {
            id: '1',
            roleAccess: RoleAccess.UPDATE,
            email: 'member1@gmail.com',
          },
          {
            id: '2',
            roleAccess: RoleAccess.READ,
            email: 'member2@gmail.com',
          },
        ],
        ownerId: 'owner_id',
      };

      const existedMembers = [
        { member: { id: '1' }, roleAccess: RoleAccess.UPDATE },
        { member: { id: '2' }, roleAccess: RoleAccess.READ },
      ];

      mockAccountsSharingMembersRepository.find.mockResolvedValue(
        existedMembers,
      );
      mockAccountsSharingMembersRepository.update.mockResolvedValue({
        affected: 1,
      });

      await service.updateRoleAccess(updateDto);
      expect(mockAccountsSharingMembersRepository.update).toHaveBeenCalledWith(
        { account: { id: '123' }, member: { id: '1' } },
        { roleAccess: RoleAccess.UPDATE },
      );
      expect(mockAccountsSharingMembersRepository.update).toHaveBeenCalledWith(
        { account: { id: '123' }, member: { id: '2' } },
        { roleAccess: RoleAccess.READ },
      );
    });

    it('should throw an error if a member is not found during update', async () => {
      const updateDto: UpdateAccountSharingMemberDto = {
        accountId: '123',
        sharingMembers: [
          {
            id: '1',
            roleAccess: RoleAccess.UPDATE,
            email: 'member1@gmail.com',
          },
        ],
        ownerId: 'owner_id',
      };

      const existedMembers = [
        { member: { id: '2' }, roleAccess: RoleAccess.READ },
      ];

      mockAccountsSharingMembersRepository.find.mockResolvedValue(
        existedMembers,
      );
      mockAccountsSharingMembersRepository.update.mockResolvedValue({
        affected: 0,
      });

      await expect(service.updateRoleAccess(updateDto)).rejects.toThrowError(
        `${ErrorCode.MEMBER_NOT_FOUND}: Member ID 1 not found in account 123`,
      );
    });

    it('should delete members who are not in the new sharing members list', async () => {
      const updateDto: UpdateAccountSharingMemberDto = {
        accountId: '123',
        sharingMembers: [
          {
            id: '1',
            roleAccess: RoleAccess.UPDATE,
            email: 'member1@gmail.com',
          },
        ],
        ownerId: 'owner_id',
      };

      const existedMembers = [
        { member: { id: '1' }, roleAccess: RoleAccess.UPDATE },
        { member: { id: '2' }, roleAccess: RoleAccess.READ },
      ];

      mockAccountsSharingMembersRepository.find.mockResolvedValue(
        existedMembers,
      );

      mockAccountsSharingMembersRepository.update.mockResolvedValue({
        affected: 1,
      });

      mockAccountsSharingMembersRepository.delete.mockResolvedValue({
        affected: 1,
      });

      await service.updateRoleAccess(updateDto);

      expect(mockAccountsSharingMembersRepository.delete).toHaveBeenCalledWith({
        account: { id: '123' },
        member: { id: '2' },
      });

      expect(mockAccountsSharingMembersRepository.update).toHaveBeenCalledWith(
        { account: { id: '123' }, member: { id: '1' } },
        { roleAccess: RoleAccess.UPDATE },
      );
    });
  });
});
