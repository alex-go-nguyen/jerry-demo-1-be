import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

import { User } from '@/modules/user/entities/user.entity';
import { Workspace } from '@/modules/workspace/entities/workspace.entity';
import { AccountVersion } from '@/modules/account-version/entities/account-version.entity';
import { AccountsSharingMembers } from '@/modules/accounts-sharing-members/entities/accounts-sharing-members.entity';

@Entity()
export class Account {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column()
  domain: string;

  @ApiProperty()
  @Column()
  username: string;

  @ApiProperty()
  @Column()
  password: string;

  @CreateDateColumn({ type: 'timestamptz' })
  @ApiProperty()
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  @ApiProperty()
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  @ApiProperty()
  deletedAt?: Date;

  @ApiProperty()
  @ManyToOne(() => User, (user) => user.accounts)
  @JoinColumn()
  owner: User;

  @OneToMany(
    () => AccountsSharingMembers,
    (sharingMember) => sharingMember.account,
  )
  @ApiProperty()
  members: AccountsSharingMembers[];

  @OneToMany(() => AccountVersion, (version) => version.account)
  @ApiProperty()
  versions: AccountVersion[];

  @ManyToMany(() => Workspace, (workspace) => workspace.accounts)
  workspaces: Workspace[];
}
