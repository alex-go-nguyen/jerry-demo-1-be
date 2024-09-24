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
  @PrimaryGeneratedColumn('uuid')
  ac_id: string;

  @ApiProperty()
  @ManyToOne(() => User, (user) => user.accounts, { eager: false })
  @JoinColumn({ name: 'us_id' })
  user: User;

  @Column()
  @ApiProperty()
  ac_domain: string;

  @Column()
  @ApiProperty()
  ac_username: string;

  @Column()
  @ApiProperty()
  ac_password: string;

  @CreateDateColumn({ type: 'timestamptz' })
  @ApiProperty()
  ac_createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  @ApiProperty()
  ac_updatedAt: Date;
}
