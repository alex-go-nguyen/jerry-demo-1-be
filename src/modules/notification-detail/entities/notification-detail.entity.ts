import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

import { MemberActivityLog } from '@/modules/member-activity-log/entities/member-activity-log.entity';
import { AccountsSharingInvitations } from '@/modules/accounts-sharing-invitations/entities/accounts-sharing-invitations.entity';
import { WorkspacesSharingInvitations } from '@/modules/workspaces-sharing-invitations/entities/workspaces-sharing-invitations.entity';

@Entity()
export class NotificationDetail {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiPropertyOptional()
  @OneToOne(() => MemberActivityLog, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn()
  memberActivityLog: MemberActivityLog;

  @ApiPropertyOptional()
  @OneToOne(() => AccountsSharingInvitations, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  accountSharingInvitation: AccountsSharingInvitations;

  @ApiPropertyOptional()
  @OneToOne(() => WorkspacesSharingInvitations, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  workspaceSharingInvitation: WorkspacesSharingInvitations;
}
