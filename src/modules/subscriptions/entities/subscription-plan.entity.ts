import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

import { SubscriptionPlanNames } from '@/common/enums';

import { User } from '@/modules/user/entities/user.entity';

@Entity('subscription_templates')
export class SubscriptionPlan {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({
    type: 'enum',
    enum: SubscriptionPlanNames,
    default: SubscriptionPlanNames.FREE,
    unique: true,
  })
  name: SubscriptionPlanNames;

  @ApiProperty()
  @Column({ default: 10 })
  maxAccounts: number;

  @ApiProperty()
  @Column({ nullable: true })
  weights: number;

  @ApiProperty()
  @Column({ default: 0 })
  maxWorkspaces: number;

  @ApiProperty()
  @Column({ nullable: true })
  price: number;

  @ApiProperty()
  @Column({ nullable: true })
  description: string;

  @ApiProperty()
  @OneToMany(() => User, (user) => user.subscription)
  users: User[];

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
