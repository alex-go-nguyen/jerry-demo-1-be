import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from '@/modules/user/entities/user.entity';
import { RoleAccess, StatusInvitation } from '@/common/enums';
import { Workspace } from '@/modules/workspace/entities/workspace.entity';

@Entity()
export class WorkspacesSharingInvitations {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  owner: User;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  workspace: Workspace;

  @Column()
  email: string;

  @Column({
    type: 'enum',
    enum: StatusInvitation,
    default: StatusInvitation.PENDING,
  })
  status: StatusInvitation;

  @Column({
    type: 'enum',
    enum: RoleAccess,
    default: RoleAccess.READ,
  })
  roleAccess: RoleAccess;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
