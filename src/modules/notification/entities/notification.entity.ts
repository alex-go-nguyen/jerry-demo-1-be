import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

import { ActivityType } from '@/common/enums';
import { User } from '@/modules/user/entities/user.entity';
import { NotificationDetail } from '@/modules/notification-detail/entities/notification-detail.entity';

@Entity()
export class Notification {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column()
  receipient: string;

  @ApiProperty()
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  sender: User;

  @ApiProperty()
  @Column({
    type: 'enum',
    enum: ActivityType,
  })
  activityType: ActivityType;

  @ApiProperty()
  @Column({ default: false })
  isRead: boolean;

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @ApiProperty()
  @OneToOne(() => NotificationDetail, { nullable: true })
  @JoinColumn({ name: 'notificationDetailId' })
  notificationDetail: NotificationDetail;
}
