import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Role } from '@/common/enums';

import { User } from '@/modules/user/entities/user.entity';
import { Account } from '@/modules/account/entities/account.entity';
import { Workspace } from '@/modules/workspace/entities/workspace.entity';

import { TABLES } from '@/utils/constants';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
  ) {}

  async getUserRegistrations() {
    const data = await this.userRepository
      .createQueryBuilder(TABLES.user)
      .select("TO_CHAR(user.createdAt, 'Month') as month")
      .addSelect('CAST(EXTRACT(YEAR FROM user.createdAt) AS INTEGER) as year')
      .addSelect('CAST(COUNT(user.id) AS INTEGER) as value')
      .where('user.role <> :role', { role: Role.Admin })
      .andWhere('(user.deletedAt IS NULL OR user.deletedAt IS NOT NULL)')
      .groupBy("TO_CHAR(user.createdAt, 'Month')")
      .addGroupBy('EXTRACT(YEAR FROM user.createdAt)')
      .addGroupBy('EXTRACT(MONTH FROM user.createdAt)')
      .orderBy('year', 'DESC')
      .addOrderBy('EXTRACT(MONTH FROM user.createdAt)', 'ASC')
      .getRawMany();

    const years = [...new Set(data.map((item) => +item.year))];

    return { years, data };
  }

  async getAccountsByDomain() {
    const result = await this.accountRepository
      .createQueryBuilder(TABLES.account)
      .select('account.domain', 'domain')
      .addSelect('COUNT(account.id)', 'value')
      .groupBy('account.domain')
      .orderBy('value', 'DESC')
      .getRawMany();

    const popularDomains = [
      'gmail.com',
      'facebook.com',
      'outlook.com',
      'edu.vn',
    ];

    const domainAggregation: Record<string, number> = {
      others: 0,
    };

    result.forEach((item) => {
      let domain = item.domain;
      const value = +item.value;
      if (domain.endsWith('.edu.vn')) {
        domain = 'edu.vn';
      }
      if (popularDomains.includes(domain)) {
        domainAggregation[domain] = (domainAggregation[domain] || 0) + value;
      } else {
        domainAggregation['others'] += value;
      }
    });
    const aggregatedResult = Object.entries(domainAggregation).map(
      ([domain, value]) => ({
        domain,
        value,
      }),
    );

    return aggregatedResult;
  }

  async getQuantityUser() {
    const quantityUser = await this.userRepository.count({
      where: [{ role: Role.User }],
      withDeleted: true,
    });
    return quantityUser;
  }

  async getQuantityAccount() {
    const quantityAccount = await this.accountRepository.count({
      withDeleted: true,
    });
    return quantityAccount;
  }

  async getQuantityWorkspace() {
    const quantityWorkspace = await this.workspaceRepository.count({
      withDeleted: true,
    });
    return quantityWorkspace;
  }
}
