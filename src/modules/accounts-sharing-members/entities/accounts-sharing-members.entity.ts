import { Entity, ManyToOne, Column, PrimaryColumn, Index } from 'typeorm';

import { RoleAccess } from '@/common/enums';
import { User } from '@/modules/user/entities/user.entity';
import { Account } from '@/modules/account/entities/account.entity';

@Entity('accounts_sharing_members')
@Index(['accountId', 'memberId'], { unique: true })
export class AccountsSharingMembers {
  @PrimaryColumn()
  accountId: string;

  @PrimaryColumn()
  memberId: string;

  @ManyToOne(() => Account, (account) => account.members)
  account: Account;

  @ManyToOne(() => User, (user) => user.accounts)
  member: User;

  @Column({
    type: 'enum',
    enum: RoleAccess,
    default: RoleAccess.READ,
  })
  roleAccess: RoleAccess;
}
