import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { EntityType, RoleAccess } from '@/common/enums';
import { Account } from '@/modules/account/entities/account.entity';
import { Workspace } from '@/modules/workspace/entities/workspace.entity';

@Entity()
export class MemberActivityLog {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({
    type: 'enum',
    enum: EntityType,
  })
  entityType: EntityType;

  @ApiProperty()
  @Column({ type: 'enum', enum: RoleAccess })
  action: RoleAccess;

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @ApiPropertyOptional()
  @ManyToOne(() => Account, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn()
  account?: Account;

  @ApiPropertyOptional()
  @ManyToOne(() => Workspace, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn()
  workspace?: Workspace;
}
