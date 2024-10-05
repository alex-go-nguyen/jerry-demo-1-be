import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '@/modules/user/entities/user.entity';

@Entity()
export class Account {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid', { name: 'ac_id' })
  id: string;

  @ApiProperty()
  @ManyToOne(() => User, (user) => user.accounts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'us_id' })
  user: User;

  @ApiProperty()
  @Column({ name: 'ac_domain' })
  domain: string;

  @ApiProperty()
  @Column({ name: 'ac_username' })
  username: string;

  @ApiProperty()
  @Column({ name: 'ac_password' })
  password: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'ac_createdAt' })
  @ApiProperty()
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'ac_updatedAt' })
  @ApiProperty()
  updatedAt: Date;
}
