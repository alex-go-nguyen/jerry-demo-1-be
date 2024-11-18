import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  DeleteDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

import { User } from '@/modules/user/entities/user.entity';

@Entity()
export class LoginHistory {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @ManyToOne(() => User, (user) => user.loginHistories, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @ApiProperty()
  @Column()
  deviceId: string;

  @ApiProperty()
  @Column()
  ipAddress: string;

  @ApiProperty()
  @Column()
  userAgent: string;

  @ApiProperty()
  @Column()
  address: string;

  @ApiProperty()
  @Column('double precision')
  lat: number;

  @ApiProperty()
  @Column('double precision')
  lon: number;

  @CreateDateColumn({ type: 'timestamptz' })
  @ApiProperty()
  loginTime: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  @ApiProperty()
  deletedAt?: Date;
}
