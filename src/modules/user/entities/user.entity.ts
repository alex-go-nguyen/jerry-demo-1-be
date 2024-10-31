import { Role } from '@/common/enums';
import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  DeleteDateColumn,
  OneToOne,
} from 'typeorm';

import { Account } from '@/modules/account/entities/account.entity';
import { Workspace } from '@/modules/workspace/entities/workspace.entity';
import { UserTwoFa } from '@/modules/user-twofa/entities/user-two-fa.entity';

@Entity()
export class User {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column()
  name: string;

  @ApiProperty()
  @Column({ unique: true })
  email: string;

  @ApiProperty()
  @Column()
  password: string;

  @ApiProperty()
  @Column({ nullable: true })
  phoneNumber: string;

  @ApiProperty()
  @Column({ nullable: true })
  avatar: string;

  @ApiProperty()
  @Column({ default: false })
  isAuthenticated: boolean;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.User,
  })
  @ApiProperty()
  role: string;

  @OneToOne(() => UserTwoFa, (userTwoFa) => userTwoFa.user)
  userTwoFa: UserTwoFa;

  @OneToMany(() => Account, (account) => account.user)
  @ApiProperty({ type: () => [Account] })
  accounts: Account[];

  @ManyToMany(() => Workspace, (workspace) => workspace.members)
  @ApiProperty()
  workspaces: Workspace[];

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
