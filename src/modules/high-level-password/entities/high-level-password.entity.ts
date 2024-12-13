import {
  Entity,
  Column,
  JoinColumn,
  PrimaryGeneratedColumn,
  ManyToOne,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

import { User } from '@/modules/user/entities/user.entity';
import { StatusTwoFa, TypeHighLevelPassword } from '@/common/enums';

@Entity()
export class HighLevelPassword {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty()
  id: string;

  @ManyToOne(() => User, (user) => user.highLevelPasswords)
  @JoinColumn()
  @ApiProperty()
  user: User;

  @ApiProperty()
  @Column()
  password: string;

  @ApiProperty()
  @Column({
    type: 'enum',
    enum: StatusTwoFa,
    default: StatusTwoFa.ENABLED,
  })
  status: string;

  @ApiProperty()
  @Column({
    type: 'enum',
    enum: TypeHighLevelPassword,
    default: TypeHighLevelPassword.TEXT_KEY,
  })
  type: string;
}
