import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  DeleteDateColumn,
  OneToOne,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

import { Role } from '@/common/enums';
import { Account } from '@/modules/account/entities/account.entity';
import { Workspace } from '@/modules/workspace/entities/workspace.entity';
import { UserTwoFa } from '@/modules/user-twofa/entities/user-two-fa.entity';
import { ContactInfo } from '@/modules/contact-info/entities/contact-info.entity';
import { LoginHistory } from '@/modules/login-history/entities/login-history.entity';
import { AccountsSharingMembers } from '@/modules/accounts-sharing-members/entities/accounts-sharing-members.entity';

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
  @Column({ default: false })
  isAuthenticated: boolean;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.User,
  })
  @ApiProperty()
  role: string;

  @OneToOne(() => UserTwoFa, (userTwoFa) => userTwoFa.user)
  userTwoFa: UserTwoFa;

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

  @ManyToMany(() => Workspace, (workspace) => workspace.members)
  @ApiProperty()
  workspaces: Workspace[];

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
