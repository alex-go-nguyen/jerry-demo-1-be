import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';

import { ErrorCode } from '@/common/enums';
import { User } from '@/modules/user/entities/user.entity';

import { ContactInfoService } from './contact-info.service';
import { ContactInfo } from './entities/contact-info.entity';
import { CreateContactInfoDto, UpdateContactInfoDto } from './dtos';

describe('ContactInfoService', () => {
  let service: ContactInfoService;

  const mockContactInfoRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    softRemove: jest.fn(),
    restore: jest.fn(),
  };

  const user: User = { id: 'user-id' } as User;
  const mockContactInfo: ContactInfo = {
    id: 'contact-info-id',
    title: 'mock-title',
    owner: user,
    email: 'test@example.com',
    phoneNumber: '1234567890',
  } as ContactInfo;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactInfoService,
        {
          provide: getRepositoryToken(ContactInfo),
          useValue: mockContactInfoRepository,
        },
      ],
    }).compile();

    service = module.get<ContactInfoService>(ContactInfoService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new contact info and save it to the repository', async () => {
      const createContactInfoData: CreateContactInfoDto = {
        title: 'mock-title',
        email: 'new@example.com',
        phoneNumber: '0987654321',
      };

      mockContactInfoRepository.create.mockReturnValue(mockContactInfo);
      mockContactInfoRepository.save.mockResolvedValue(mockContactInfo);

      const result = await service.create(user, createContactInfoData);

      expect(mockContactInfoRepository.create).toHaveBeenCalledWith({
        owner: user,
        ...createContactInfoData,
      });
      expect(mockContactInfoRepository.save).toHaveBeenCalledWith(
        mockContactInfo,
      );
      expect(result).toEqual(mockContactInfo);
    });
  });

  describe('getContactInfoByUserId', () => {
    it('should return contact info for a given user id', async () => {
      mockContactInfoRepository.find.mockResolvedValue([mockContactInfo]);

      const result = await service.getContactInfoByUserId(user.id);

      expect(mockContactInfoRepository.find).toHaveBeenCalledWith({
        where: { owner: { id: user.id } },
        relations: ['owner'],
        select: { owner: { id: true } },
      });
      expect(result).toEqual([mockContactInfo]);
    });
  });

  describe('getContactInfoById', () => {
    it('should return the contact info if it exists', async () => {
      mockContactInfoRepository.findOne.mockResolvedValue(mockContactInfo);

      const result = await service.getContactInfoById(
        user.id,
        mockContactInfo.id,
      );

      expect(mockContactInfoRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockContactInfo.id, owner: { id: user.id } },
        relations: ['owner'],
        select: { owner: { id: true } },
      });
      expect(result).toEqual(mockContactInfo);
    });

    it('should throw an error if the contact info does not exist', async () => {
      mockContactInfoRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getContactInfoById(user.id, mockContactInfo.id),
      ).rejects.toThrow(ErrorCode.CONTACT_INFO_NOT_FOUND);
    });
  });

  describe('update', () => {
    it('should update the contact info if it exists', async () => {
      const updateContactInfoData: UpdateContactInfoDto = {
        email: 'updated@example.com',
        phoneNumber: '9876543210',
      };

      mockContactInfoRepository.findOne.mockResolvedValue(mockContactInfo);
      mockContactInfoRepository.save.mockResolvedValue(mockContactInfo);

      const result = await service.update(
        user.id,
        mockContactInfo.id,
        updateContactInfoData,
      );

      expect(mockContactInfoRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockContactInfo.id, owner: { id: user.id } },
      });
      expect(mockContactInfoRepository.save).toHaveBeenCalledWith({
        ...mockContactInfo,
        ...updateContactInfoData,
      });
      expect(result).toEqual(mockContactInfo);
    });

    it('should throw an error if the contact info does not exist', async () => {
      const updateContactInfoData: UpdateContactInfoDto = {
        email: 'updated@example.com',
        phoneNumber: '9876543210',
      };

      mockContactInfoRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(user.id, mockContactInfo.id, updateContactInfoData),
      ).rejects.toThrow(ErrorCode.CONTACT_INFO_NOT_FOUND);
    });
  });

  describe('softRemove', () => {
    it('should soft remove the contact info if it exists', async () => {
      mockContactInfoRepository.findOne.mockResolvedValue(mockContactInfo);
      mockContactInfoRepository.softRemove.mockResolvedValue(mockContactInfo);

      const result = await service.softRemove(user.id, mockContactInfo.id);

      expect(mockContactInfoRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockContactInfo.id, owner: { id: user.id } },
        relations: ['owner'],
      });
      expect(mockContactInfoRepository.softRemove).toHaveBeenCalledWith(
        mockContactInfo,
      );
      expect(result).toEqual(mockContactInfo);
    });

    it('should throw an error if the contact info does not exist', async () => {
      mockContactInfoRepository.findOne.mockResolvedValue(null);

      await expect(
        service.softRemove(user.id, mockContactInfo.id),
      ).rejects.toThrow(ErrorCode.CONTACT_INFO_NOT_FOUND);
    });
  });

  describe('restore', () => {
    it('should restore the soft deleted contact info', async () => {
      mockContactInfoRepository.restore.mockResolvedValue(mockContactInfo);

      await service.restore(mockContactInfo.id);

      expect(mockContactInfoRepository.restore).toHaveBeenCalledWith({
        id: mockContactInfo.id,
      });
    });
  });
});
