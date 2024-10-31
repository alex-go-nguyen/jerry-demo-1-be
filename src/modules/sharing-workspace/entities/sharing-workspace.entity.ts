import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from '@/modules/user/entities/user.entity';
import { Workspace } from '@/modules/workspace/entities/workspace.entity';
import { statusInvitationWorkspace } from '@/common/enums';

@Entity()
export class WorkspaceSharingInvitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  owner: User;

  @ManyToOne(() => Workspace)
  workspace: Workspace;

  @Column()
  email: string;

  @Column({
    type: 'enum',
    enum: statusInvitationWorkspace,
    default: statusInvitationWorkspace.PENDING,
  })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
