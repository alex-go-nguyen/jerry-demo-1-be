import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  JoinTable,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { User } from '@/modules/user/entities/user.entity';
import { Account } from '@/modules/account/entities/account.entity';
import { WorkspacesSharingMembers } from '@/modules/workspaces-sharing-members/entities/workspaces-sharing-members.entity';
@Entity()
export class Workspace {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty()
  id: string;

  @Column({ type: 'varchar', length: 255 })
  @IsNotEmpty()
  @ApiProperty()
  name: string;

  @CreateDateColumn({ type: 'timestamptz' })
  @ApiProperty()
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  @ApiProperty()
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  @ApiProperty()
  deletedAt?: Date;

  @ManyToOne(() => User, (user) => user.workspaces, { onDelete: 'CASCADE' })
  @JoinColumn()
  @ApiProperty()
  owner: User;

  @OneToMany(
    () => WorkspacesSharingMembers,
    (sharingMember) => sharingMember.workspace,
  )
  @ApiProperty()
  members: WorkspacesSharingMembers[];

  @ManyToMany(() => Account, (account) => account.workspaces)
  @JoinTable({
    name: 'workspace_accounts',
    joinColumn: { name: 'workspaceId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'accountId', referencedColumnName: 'id' },
  })
  @ApiProperty()
  accounts: Account[];
}
