import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { ErrorCode } from '@/common/enums';
import { Injectable } from '@nestjs/common';
import { AccountVersion } from './entities/account-version.entity';

import { CreateAccountVersionDto } from './dto/create-account-version.dto';

@Injectable()
export class AccountVersionService {
  constructor(
    @InjectRepository(AccountVersion)
    private readonly accountVersionRepository: Repository<AccountVersion>,
  ) {}

  async create(createAccountVersionDto: CreateAccountVersionDto) {
    const accountVersionData = this.accountVersionRepository.create({
      ...createAccountVersionDto,
      account: { id: createAccountVersionDto.accountId },
      actor: { id: createAccountVersionDto.actorId },
    });
    return await this.accountVersionRepository.save(accountVersionData);
  }

  async getAccountVersions(accountId: string) {
    const accountVersions = await this.accountVersionRepository.find({
      where: {
        account: {
          id: accountId,
        },
      },
      relations: ['actor'],
      select: {
        actor: {
          name: true,
          email: true,
          avatar: true,
        },
      },
      order: {
        createdAt: 'ASC',
      },
    });
    return accountVersions;
  }

  async findOne(versionId: string, ownerId: string) {
    const accountVersion = await this.accountVersionRepository.findOne({
      where: {
        id: versionId,
        account: {
          owner: { id: ownerId },
        },
      },
      relations: ['account'],
    });
    if (!accountVersion) {
      throw new Error(ErrorCode.ACCOUNT_VERSION_NOT_FOUND);
    }
    return accountVersion;
  }

  async remove(versionId: string, ownerId: string) {
    const accountVersion = await this.accountVersionRepository.findOne({
      where: {
        id: versionId,
        account: {
          owner: { id: ownerId },
        },
      },
      relations: ['account'],
    });

    if (!accountVersion) {
      throw new Error(ErrorCode.ACCOUNT_VERSION_NOT_FOUND);
    }

    return await this.accountVersionRepository.remove(accountVersion);
  }
}
