import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@/modules/user/entities/user.entity';
import { Account } from '@/modules/account/entities/account.entity';
import { Role } from '@/common/enums';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
  ) {}

  async getUserRegistrations(): Promise<{
    years: number[];
    data: { month: string; year: number; value: number }[];
  }> {
    const result = await this.userRepository
      .createQueryBuilder('user')
      .select("TO_CHAR(user.createdAt, 'Month') as month")
      .addSelect('EXTRACT(YEAR FROM user.createdAt) as year')
      .addSelect('COUNT(user.id) as value')
      .where('user.role <> :role', { role: Role.Admin })
      .groupBy("TO_CHAR(user.createdAt, 'Month')")
      .addGroupBy('EXTRACT(YEAR FROM user.createdAt)')
      .addGroupBy('EXTRACT(MONTH FROM user.createdAt)')
      .orderBy('year', 'DESC')
      .addOrderBy('EXTRACT(MONTH FROM user.createdAt)', 'ASC')
      .getRawMany();

    const years = [...new Set(result.map((item) => +item.year))];

    const data = result.map((item) => ({
      month: item.month.trim(),
      year: +item.year,
      value: +item.value,
    }));

    return { years, data };
  }

  async getAccountsByDomain(): Promise<{ domain: string; value: number }[]> {
    const result = await this.accountRepository
      .createQueryBuilder('account')
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
}
