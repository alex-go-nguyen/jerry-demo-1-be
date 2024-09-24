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
  @PrimaryGeneratedColumn('uuid')
  us_id: string;

  @Column()
  @ApiProperty()
  us_name: string;

  @Column({ unique: true })
  @ApiProperty()
  us_email: string;

  @Column()
  @ApiProperty()
  us_password: string;

  @Column({ default: false })
  @ApiProperty()
  us_isAuthenticated: boolean;

  @Column({
    type: 'enum',
    enum: Role,
    array: true,
    default: [Role.User],
  })
  @ApiProperty({ isArray: true })
  us_roles: Role[];

  @OneToMany(() => Account, (account) => account.user)
  @ApiProperty({ type: () => [Account] })
  accounts: Account[];

  @CreateDateColumn({ type: 'timestamptz' })
  @ApiProperty()
  ac_createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  @ApiProperty()
  ac_updatedAt: Date;
}
