import { ApiProperty } from '@nestjs/swagger';
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
} from 'typeorm';

import { Account } from '@/modules/account/entities/account.entity';
import { User } from '@/modules/user/entities/user.entity';
@Entity()
export class Workspace {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty()
  id: string;

  @Column({ type: 'varchar', length: 255 })
  @ApiProperty()
  name: string;

  @ManyToOne(() => User, (user) => user.workspaces)
  @JoinColumn({ name: 'userId' })
  @ApiProperty()
  owner: User;

  @ManyToMany(() => User, (user) => user.workspaces)
  @JoinTable({
    name: 'workspace_users',
    joinColumn: { name: 'workspaceId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
  })
  @ApiProperty()
  members: User[];

  @ManyToMany(() => Account, (account) => account.workspaces, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinTable({
    name: 'workspace_accounts',
    joinColumn: { name: 'workspaceId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'accountId', referencedColumnName: 'id' },
  })
  @ApiProperty()
  accounts: Account[];

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
