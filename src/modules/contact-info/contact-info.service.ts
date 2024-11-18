import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { ErrorCode } from '@/common/enums';
import { User } from '@/modules/user/entities/user.entity';

import { ContactInfo } from './entities/contact-info.entity';
import { CreateContactInfoDto, UpdateContactInfoDto } from './dtos';

@Injectable()
export class ContactInfoService {
  constructor(
    @InjectRepository(ContactInfo)
    private readonly contactInfoRepository: Repository<ContactInfo>,
  ) {}

  async create(user: User, createContactInfoData: CreateContactInfoDto) {
    const newContactInfo = this.contactInfoRepository.create({
      owner: user,
      ...createContactInfoData,
    });

    return this.contactInfoRepository.save(newContactInfo);
  }

  async getContactInfoByUserId(userId: string) {
    return await this.contactInfoRepository.find({
      where: {
        owner: { id: userId },
      },
      relations: ['owner'],
      select: { owner: { id: true } },
    });
  }

  async getContactInfoById(userId: string, contactInfoId: string) {
    const existedContactInfo = await this.contactInfoRepository.findOne({
      where: { id: contactInfoId, owner: { id: userId } },
      relations: ['owner'],
      select: {
        owner: { id: true },
      },
    });

    if (!existedContactInfo) {
      throw new Error(ErrorCode.CONTACT_INFO_NOT_FOUND);
    }

    return existedContactInfo;
  }

  async update(
    userId: string,
    contactInfoId: string,
    updateContactInfoData: UpdateContactInfoDto,
  ) {
    const existedContactInfo = await this.contactInfoRepository.findOne({
      where: { id: contactInfoId, owner: { id: userId } },
    });
    if (!existedContactInfo) {
      throw new Error(ErrorCode.CONTACT_INFO_NOT_FOUND);
    }
    Object.assign(existedContactInfo, updateContactInfoData);

    return this.contactInfoRepository.save(existedContactInfo);
  }

  async softRemove(userId: string, contactInfoId: string) {
    const existedContactInfo = await this.contactInfoRepository.findOne({
      where: { id: contactInfoId, owner: { id: userId } },
      relations: ['owner'],
    });

    if (!existedContactInfo) throw new Error(ErrorCode.CONTACT_INFO_NOT_FOUND);

    return this.contactInfoRepository.softRemove(existedContactInfo);
  }

  async restore(contactInfoId: string) {
    await this.contactInfoRepository.restore({ id: contactInfoId });
  }
}
