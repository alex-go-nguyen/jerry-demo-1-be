import { StatusTwoFa } from '@/common/enums';
import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  Column,
  OneToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from '@/modules/user/entities/user.entity';

@Entity()
export class UserTwoFa {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty()
  id: string;

  @OneToOne(() => User, (user) => user.userTwoFa)
  @JoinColumn()
  @ApiProperty()
  user: User;

  @ApiProperty()
  @Column()
  secret: string;

  @ApiProperty()
  @Column({ default: StatusTwoFa.NOT_REGISTERED })
  status: string;
}
