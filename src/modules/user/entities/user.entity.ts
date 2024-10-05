import { Role } from '@/common/enums';
import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Account } from '@/modules/account/entities/account.entity';

@Entity()
export class User {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid', { name: 'us_id' })
  id: string;

  @ApiProperty()
  @Column({ name: 'us_name' })
  name: string;

  @Column({ unique: true })
  @ApiProperty()
  @Column({ name: 'us_email' })
  email: string;

  @ApiProperty()
  @Column({ name: 'us_password' })
  password: string;

  @ApiProperty()
  @Column({ name: 'us_isAuthenticated', default: false })
  isAuthenticated: boolean;

  @Column({
    type: 'enum',
    name: 'us_roles',
    enum: Role,
    array: true,
    default: [Role.User],
  })
  @ApiProperty({ isArray: true })
  roles: Role[];

  @OneToMany(() => Account, (account) => account.user)
  @ApiProperty({ type: () => [Account] })
  accounts: Account[];

  @CreateDateColumn({ type: 'timestamptz', name: 'us_createdAt' })
  @ApiProperty()
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'us_updatedAt' })
  @ApiProperty()
  updatedAt: Date;
}
