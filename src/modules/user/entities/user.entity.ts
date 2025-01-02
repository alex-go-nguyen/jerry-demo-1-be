import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  DeleteDateColumn,
  OneToOne,
  ManyToOne,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

import { Role } from '@/common/enums';
import { Account } from '@/modules/account/entities/account.entity';
import { Workspace } from '@/modules/workspace/entities/workspace.entity';
import { UserTwoFa } from '@/modules/user-twofa/entities/user-two-fa.entity';
import { ContactInfo } from '@/modules/contact-info/entities/contact-info.entity';
import { LoginHistory } from '@/modules/login-history/entities/login-history.entity';
import { HighLevelPassword } from '@/modules/high-level-password/entities/high-level-password.entity';
import { AccountsSharingMembers } from '@/modules/accounts-sharing-members/entities/accounts-sharing-members.entity';
import { WorkspacesSharingMembers } from '@/modules/workspaces-sharing-members/entities/workspaces-sharing-members.entity';
import { SubscriptionPlan } from '@/modules/subscriptions/entities/subscription-plan.entity';

@Entity()
export class User {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column()
  name: string;

  @ApiProperty()
  @Column({ unique: true })
  email: string;

  @ApiProperty()
  @Column()
  password: string;

  @ApiProperty()
  @Column({ nullable: true })
  phoneNumber: string;

  @ApiProperty()
  @Column({ nullable: true })
  avatar: string;

  @ApiProperty()
  @Column({ nullable: true })
  subscriptionPaymentId: string;

  @ApiProperty()
  @Column({ default: false })
  isAuthenticated: boolean;

  @ApiProperty()
  @Column({
    type: 'enum',
    enum: Role,
    default: Role.User,
  })
  @ApiProperty()
  role: string;

  @OneToOne(() => UserTwoFa, (userTwoFa) => userTwoFa.user)
  userTwoFa: UserTwoFa;

  @OneToMany(() => HighLevelPassword, (password) => password.user)
  @ApiProperty({ type: () => [HighLevelPassword] })
  highLevelPasswords: HighLevelPassword[];

  @OneToMany(() => Account, (account) => account.owner)
  @ApiProperty({ type: () => [Account] })
  accounts: Account[];

  @OneToMany(() => AccountsSharingMembers, (member) => member.member)
  sharedAccounts: AccountsSharingMembers[];

  @OneToMany(() => ContactInfo, (contactInfo) => contactInfo.owner)
  @ApiProperty({ type: () => [ContactInfo] })
  contactInfos: ContactInfo[];

  @OneToMany(() => LoginHistory, (loginHistory) => loginHistory.user)
  @ApiProperty({ type: () => [LoginHistory] })
  loginHistories: LoginHistory[];

  @OneToMany(() => Workspace, (workspace) => workspace.owner)
  @ApiProperty({ type: () => [Workspace] })
  workspaces: Workspace[];

  @OneToMany(() => WorkspacesSharingMembers, (member) => member.member)
  sharedWorkspaces: WorkspacesSharingMembers[];

  @ManyToOne(
    () => SubscriptionPlan,
    (subscriptionPlan) => subscriptionPlan.users,
  )
  subscription: SubscriptionPlan;

  @ManyToOne(() => SubscriptionPlan)
  toUpgradeSubscription: SubscriptionPlan;

  @CreateDateColumn({ type: 'timestamptz' })
  @ApiProperty()
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  @ApiProperty()
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  @ApiProperty()
  deletedAt?: Date;
}
