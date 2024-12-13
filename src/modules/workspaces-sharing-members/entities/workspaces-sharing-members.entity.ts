import { Entity, ManyToOne, Column, PrimaryColumn, Index } from 'typeorm';

import { RoleAccess } from '@/common/enums';
import { User } from '@/modules/user/entities/user.entity';
import { Workspace } from '@/modules/workspace/entities/workspace.entity';

@Entity('workspaces_sharing_members')
@Index(['workspaceId', 'memberId'], { unique: true })
export class WorkspacesSharingMembers {
  @PrimaryColumn()
  workspaceId: string;

  @PrimaryColumn()
  memberId: string;

  @ManyToOne(() => Workspace, (workspace) => workspace.members, {
    onDelete: 'CASCADE',
  })
  workspace: Workspace;

  @ManyToOne(() => User, (user) => user.sharedWorkspaces, {
    onDelete: 'CASCADE',
  })
  member: User;

  @Column({
    type: 'enum',
    enum: RoleAccess,
    default: RoleAccess.READ,
  })
  roleAccess: RoleAccess;
}
